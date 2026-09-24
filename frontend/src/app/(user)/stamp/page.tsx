"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin, Loader2, Clock } from "lucide-react"
import { BACKEND_URL } from "@/lib/constants";
import StampCorrectionModal from "@/components/StampCorrectionModal"
import { PageHeader } from "@/components/layout/page-header"

export default function StampPage() {
  const { isAuthenticated } = useAuth() || {};
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [status, setStatus] = useState<"NotClockedIn" | "ClockedIn" | "ClockedOut">("NotClockedIn")
  const [currentDate, setCurrentDate] = useState<string>("")

  // 打刻修正モーダル用ステート
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [shiftData, setShiftData] = useState<any>(null)

  const formatDateTime = (date: Date) => {
    const dStr = date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const tStr = date.toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${dStr} ${tStr}`;
  };

  useEffect(() => {
    setCurrentDate(formatDateTime(new Date()))
    const timer = setInterval(() => {
      setCurrentDate(formatDateTime(new Date()))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          "User-Agent": "HRConnect/1.0",
          "Accept-Language": "ja"
        }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.display_name || "住所不明";
        setAddress(addr);
      }
    } catch (e) {
      console.error("Failed to fetch address", e);
    }
  };

  const handleGetLocation = () => {
    setLocationLoading(true);
    setError(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          await fetchAddress(lat, lng);
          setLocationLoading(false);
        },
        (err) => {
          // GPS取得失敗時のフォールバック：打刻エラーを防ぐため0.0をセット
          setLocation({ lat: 0, lng: 0 });
          setAddress("位置情報未取得（GPS無効または許可なし）");
          setLocationLoading(false);
        }
      )
    } else {
      // 非対応環境でのフォールバック
      setLocation({ lat: 0, lng: 0 });
      setAddress("位置情報非対応ブラウザ");
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    handleGetLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStatus = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/attendances/today`);
      if (res.ok) {
        const data = await res.json();
        setTodayAttendance(data);
        if (data) {
          if (data.clock_out) {
            setStatus("ClockedOut");
          } else {
            setStatus("ClockedIn");
          }
        } else {
          setStatus("NotClockedIn");
        }
      }
    } catch (e) {
      console.error("Failed to fetch status", e);
    }
  };

  const fetchShift = async () => {
    if (!isAuthenticated) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const res = await fetch(`${BACKEND_URL}/api/v1/shifts/my-daily/${todayStr}`);
      if (res.ok) {
        const data = await res.json();
        setShiftData(data);
      }
    } catch (e) {
      console.error("Failed to fetch today's shift", e);
    }
  };

  // 初期ステータスの取得
  useEffect(() => {
    fetchStatus();
    fetchShift();
  }, [isAuthenticated]);

  const handleClockIn = async () => {
    if (!location) {
      setError("出勤には位置情報が必要です。")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/attendances/clock-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          work_date: new Date().toISOString().split("T")[0],
          clock_in: new Date().toISOString(),
          meta_data: {
            stamp_type: "gps",
            gps: {
              latitude: location.lat,
              longitude: location.lng,
              address: address || undefined
            },
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        let errMsg = errData.detail || "出勤打刻に失敗しました";
        if (errMsg === "Already clocked in today") {
          errMsg = "本日は既に出勤打刻済みです";
        }
        throw new Error(errMsg);
      }
      setStatus("ClockedIn")
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/attendances/clock-out`, {
        method: "POST",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "退勤打刻に失敗しました");
      }
      setStatus("ClockedOut")
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 container mx-auto max-w-7xl">
      <PageHeader
        title="打刻"
        description="出勤・退勤・休憩開始・休憩終了の打刻を行います。位置情報もあわせて記録されます。"
        icon={Clock}
      />
      <div className="flex flex-col items-center justify-center py-6">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>打刻盤</CardTitle>
            <CardDescription>
              {currentDate}
            </CardDescription>
          </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <div className="flex justify-center items-center space-x-2 text-sm text-muted-foreground bg-secondary/20 p-2 rounded-lg max-w-full">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {locationLoading ? (
                <span>位置情報取得中...</span>
              ) : location ? (
                <span className="break-all text-xs">
                  {address ? address : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                </span>
              ) : error ? (
                <div className="text-destructive text-[11px] space-y-1">
                  <div className="font-bold break-all">{error}</div>
                  <div className="font-bold border border-destructive/20 bg-destructive/5 p-1.5 rounded mt-1 leading-normal text-left">
                    ※GPS取得ができない場合は、下記ボタンより「打刻修正申請」を行ってください。
                  </div>
                </div>
              ) : (
                <span>位置情報未取得</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={handleGetLocation}
              disabled={locationLoading}
            >
              {locationLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              位置情報再取得
            </Button>
          </div>

          {shiftData && (shiftData.is_holiday || ["PaidLeave", "公休", "全休", "有給", "有休"].includes(shiftData.shift_type)) && (
            <div className="text-center text-destructive font-medium bg-destructive/10 p-2.5 rounded-lg text-xs leading-normal">
              本日は公休または休暇のため打刻できません。
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="h-32 text-xl font-bold rounded-xl"
              variant={status === "NotClockedIn" ? "default" : "outline"}
              disabled={status !== "NotClockedIn" || loading || !!error || locationLoading || (shiftData && (shiftData.is_holiday || ["PaidLeave", "公休", "全休", "有給", "有休"].includes(shiftData.shift_type)))}
              onClick={handleClockIn}
            >
              {loading && status === "NotClockedIn" ? <Loader2 className="animate-spin" /> : "出勤"}
            </Button>
            <Button
              size="lg"
              className="h-32 text-xl font-bold rounded-xl"
              variant={status === "ClockedIn" ? "destructive" : "outline"}
              disabled={status !== "ClockedIn" || loading || (shiftData && (shiftData.is_holiday || ["PaidLeave", "公休", "全休", "有給", "有休"].includes(shiftData.shift_type)))}
              onClick={handleClockOut}
            >
              {loading && status === "ClockedIn" ? <Loader2 className="animate-spin" /> : "退勤"}
            </Button>
          </div>
          {status === "ClockedOut" && (
            <div className="text-center text-muted-foreground font-medium">
              本日の業務は終了しました。お疲れ様でした。
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full text-xs"
              onClick={() => setIsModalOpen(true)}
            >
              本日の打刻を修正申請する
            </Button>
          </div>
        </CardContent>
      </Card>

      <StampCorrectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={new Date().toISOString().split("T")[0]}
        initialClockIn={todayAttendance?.clock_in || null}
        initialClockOut={todayAttendance?.clock_out || null}
        onSubmitSuccess={fetchStatus}
      />
      </div>
    </div>
  )
}
