import sys
from datetime import date, datetime
from uuid import UUID
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# アプリケーションのパスを通す
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models import (
    Base,
    User,
    Department,
    AffiliationGroup,
    WorkRule,
    Attendance,
    Shift,
    ShiftTemplate,
    Project,
    ProjectMember,
    WorkLog,
    TaskCategory,
    Application,
    ApplicationTemplate,
    PaidLeaveLedger,
    LeaveType,
    LeaveLedger,
    AuditLog,
    MonthlyClosing,
    SystemDefinition,
)

# データベース接続先URL
LOCAL_DATABASE_URL = "sqlite:///./hr_connect.db"
SUPABASE_DATABASE_URL = "postgresql://postgres.shonqzbsrzoivbscaghl:koorinosyo19910328Nt-@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres"

MODELS_TO_VERIFY = [
    SystemDefinition,
    AffiliationGroup,
    Department,
    WorkRule,
    User,
    Project,
    ProjectMember,
    TaskCategory,
    ShiftTemplate,
    Shift,
    Attendance,
    ApplicationTemplate,
    Application,
    WorkLog,
    LeaveType,
    LeaveLedger,
    PaidLeaveLedger,
    MonthlyClosing,
    AuditLog
]

def normalize_value(val):
    """
    比較のために値を文字列などの共通の比較可能フォーマットに正規化します。
    """
    if val is None:
        return None
    if isinstance(val, UUID):
        return str(val)
    if isinstance(val, (datetime, date)):
        # タイムゾーン情報を取り除いて比較
        if isinstance(val, datetime):
            val = val.replace(tzinfo=None)
        return val.isoformat()
    # SQLiteの日付・日時が文字列で格納されている可能性があるための対応
    if isinstance(val, str):
        # sqlite側の表記揺れ（ミリ秒やタイムゾーンの有無など）を吸収
        if len(val) >= 10 and val[4] == '-' and val[7] == '-':
            try:
                # dateの場合
                if len(val) == 10:
                    return date.fromisoformat(val).isoformat()
                
                # タイムゾーンサフィックスを取り除く
                clean_val = val.replace(' ', 'T')
                if '+' in clean_val:
                    clean_val = clean_val.split('+')[0]
                if clean_val.endswith('Z'):
                    clean_val = clean_val[:-1]
                if '.' in clean_val:
                    clean_val = clean_val.split('.')[0]
                
                return datetime.fromisoformat(clean_val).isoformat()
            except ValueError:
                pass
    return val

def verify_databases():
    """
    ローカルと本番のデータベースの全レコードを完全に突き合わせ検証します。
    """
    print("データベース接続の初期化中...")
    local_engine = create_engine(LOCAL_DATABASE_URL)
    LocalSession = sessionmaker(bind=local_engine)

    supabase_engine = create_engine(SUPABASE_DATABASE_URL)
    SupabaseSession = sessionmaker(bind=supabase_engine)

    all_tables_perfect = True
    verification_report = []

    with LocalSession() as local_session, SupabaseSession() as supabase_session:
        print("\n--- 全件突き合わせ検証を開始します ---")
        
        for model in MODELS_TO_VERIFY:
            table_name = model.__tablename__
            print(f"\n検証中: {table_name} ...")

            # ローカルデータの全取得
            local_items = local_session.execute(select(model)).scalars().all()
            local_dict = {str(item.id): item for item in local_items}

            # Supabaseデータの全取得
            supabase_items = supabase_session.execute(select(model)).scalars().all()
            supabase_dict = {str(item.id): item for item in supabase_items}

            # カラム一覧の取得
            columns = [c.name for c in model.__table__.columns]

            mismatches = []
            only_in_local = []
            only_in_supabase = []
            perfect_matches = 0

            # ローカルにあってSupabaseにあるものを検証、またはローカルにしかないものを特定
            for item_id, local_item in local_dict.items():
                if item_id not in supabase_dict:
                    only_in_local.append(item_id)
                    continue

                supabase_item = supabase_dict[item_id]
                row_mismatch = {}

                for col in columns:
                    local_val = normalize_value(getattr(local_item, col))
                    supabase_val = normalize_value(getattr(supabase_item, col))

                    if local_val != supabase_val:
                        row_mismatch[col] = {
                            "local": local_val,
                            "supabase": supabase_val
                        }

                if row_mismatch:
                    mismatches.append({
                        "id": item_id,
                        "diff": row_mismatch
                    })
                else:
                    perfect_matches += 1

            # Supabaseにしかないものを特定
            for item_id in supabase_dict:
                if item_id not in local_dict:
                    only_in_supabase.append(item_id)

            # 結果判定
            table_passed = (
                len(mismatches) == 0 and 
                len(only_in_local) == 0 and 
                len(only_in_supabase) == 0 and
                len(local_items) == len(supabase_items)
            )

            if not table_passed:
                all_tables_perfect = False

            report = {
                "table": table_name,
                "local_total": len(local_items),
                "supabase_total": len(supabase_items),
                "perfect_matches": perfect_matches,
                "mismatches_count": len(mismatches),
                "only_in_local_count": len(only_in_local),
                "only_in_supabase_count": len(only_in_supabase),
                "passed": table_passed,
                "details": mismatches,
                "only_in_local_ids": only_in_local,
                "only_in_supabase_ids": only_in_supabase
            }
            verification_report.append(report)

            # 進捗表示
            if table_passed:
                print(f"  ✅ {table_name}: 完全一致 (件数: {len(local_items)})")
            else:
                print(f"  ❌ {table_name}: 不一致が検出されました！")
                print(f"    - ローカル件数: {len(local_items)}件 / Supabase件数: {len(supabase_items)}件")
                if mismatches:
                    print(f"    - 値の相違レコード: {len(mismatches)}件")
                    for m in mismatches[:3]: # 最初の3件だけ表示
                        print(f"      - ID {m['id']}: {m['diff']}")
                    if len(mismatches) > 3:
                        print("      - ...他")
                if only_in_local:
                    print(f"    - ローカルにのみ存在: {len(only_in_local)}件")
                if only_in_supabase:
                    print(f"    - Supabaseにのみ存在: {len(only_in_supabase)}件")

        print("\n==========================================")
        if all_tables_perfect:
            print("🎉 検証完了: すべてのデータベーステーブルでローカルとSupabaseが【完全一致】していることを確認しました！")
        else:
            print("⚠️ 検証完了: 一部テーブルで不一致が検出されました。上記の詳細ログをご確認ください。")
        print("==========================================")

    return all_tables_perfect, verification_report

if __name__ == "__main__":
    verify_databases()
