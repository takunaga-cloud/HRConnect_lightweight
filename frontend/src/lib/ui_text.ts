export const UI_TEXT = {
    COMMON: {
        LOADING: "読み込み中...",
        NO_DATA: "データがありません。",
        SAVE: "保存",
        CANCEL: "キャンセル",
        DELETE: "削除",
        EDIT: "編集",
        CONFIRM_DELETE: "削除確認",
        CONFIRM_DELETE_MESSAGE: "本当に削除しますか？この操作は取り消せません。",
        REQUIRED: "必須",
    },
    TOAST: {
        SAVE_SUCCESS: "保存しました！",
        SAVE_ERROR: "保存に失敗しました。",
        DELETE_SUCCESS: "削除完了",
        DELETE_ERROR: "削除エラー",
        FETCH_ERROR: "データ取得エラー",
        UNKNOWN_ERROR: "不明なエラーが発生しました。",
    },
    DAILY_REPORT: {
        TITLE: "日報",
        SAVE_BUTTON: "日報を保存",
        INPUT_HOURS: "入力工数",
        ACTUAL_HOURS: "実労働時間",
        HOURS_DISCREPANCY: "工数の乖離が大きいです",
        PROJECT_TASK_REQUIRED: "プロジェクトとタスクカテゴリは必須です",
        NO_Save_DATA: "保存するデータがありません",
        NON_WORKING_DAY: "勤務外の日付は選択できません",
    },
    ADMIN: {
        ATTENDANCE_MANAGEMENT: "打刻管理",
        ATTENDANCE_DESC: "従業員の打刻記録を確認・管理・取り消しできます。",
        DELETE_ATTENDANCE_DESC: "対象の出退勤記録は永久に削除されます。",
        FAILED_TO_DELETE_ATTENDANCE: "削除に失敗しました。",
        FAILED_TO_FETCH_ATTENDANCE: "打刻データの取得に失敗しました。",
    }
} as const;
