"use client";

import {
  DateSelectArg,
  EventClickArg,
  EventApi,
  DateSpanApi,
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  weekdayAllowedTimes,
  weekendAllowedTimes,
} from "@/constants/allowedResevationTimes";
import { useReservation } from "@/hooks/useReservation";
import { Loader2 } from "lucide-react";

const Calendar = () => {
  const [currentEvents, setCurrentEvents] = useState<EventApi[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDate, setSelectedDate] = useState<DateSelectArg | null>(null);
  const [calendarKey, setCalendarKey] = useState(0);

  const { data, isLoading, mutate } = useReservation();
  console.log(data && data);

  // Helper function to check if the selected time is within allowed ranges
  const isTimeAllowed = (selectInfo: DateSelectArg) => {
    console.log({ selectInfo });
    const dayOfWeek = selectInfo.start.getUTCDay();
    const allowedTimes =
      dayOfWeek === 0 || dayOfWeek === 6
        ? weekendAllowedTimes
        : weekdayAllowedTimes;

    // Helper function to format a Date object to Japan Standard Time (HH:MM format)
    const formatTimeInTokyo = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Tokyo",
      })
        .format(date)
        .replace(/^(\d{2}).(\d{2}).*/, "$1:$2"); // Format as HH:MM
    };

    // Format the selected start and end times in Japan Standard Time
    const startTime = formatTimeInTokyo(selectInfo.start);
    const endTime = formatTimeInTokyo(selectInfo.end);

    // // Format the selected start and end times as "HH:MM"
    // const startTime = selectInfo.start.toISOString().substr(11, 5);
    // const endTime = selectInfo.end.toISOString().substr(11, 5);

    console.log({ startTime });
    console.log({ endTime });

    // Check if selected time is within any allowed time range
    return allowedTimes.some(
      (timeRange) => startTime >= timeRange.start && endTime <= timeRange.end
    );
  };

  const handleDateClick = (selected: DateSelectArg) => {
    if (!isTimeAllowed(selected)) {
      if (
        !window.confirm(
          "(平日9:00〜12:00 / 平日13:00〜18:00) 祝日・大学の休み期間などの時間外の利用は禁じられています。それでも予約を進めますか？ (祝日・大学の休み期間などの休暇期間中は利用可能です)"
        )
      ) {
        const calendarApi = selected.view.calendar;
        calendarApi.unselect();
        return; // 사용자가 "아니오"를 누르면 다이얼로그가 열리지 않음
      }
    }
    setSelectedDate(selected);
    setIsDialogOpen(true);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEventTitle && selectedDate) {
      const calendarApi = selectedDate.view.calendar;
      calendarApi.unselect();

      const newEvent = {
        id: `${newEventTitle}_${password}_${selectedDate.start.getTime()}`,
        title: newEventTitle,
        start: selectedDate?.start,
        end: selectedDate.end,
        allDay: selectedDate?.allDay,
        password: password,
      };

      console.log({ newEvent });

      const response = await fetch("/api/reservation", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });

      const data = await response.json();

      console.log({ data });

      if (data.success) {
        alert("予約が正常に完了しました。");
      } else if (!data.success) {
        alert(data.message);
      }

      await mutate();

      // key를 변경하여 캘린더 강제 리렌더링
      setCalendarKey((prevKey) => prevKey + 1);

      handleCloseDialog();
    }
  };

  const handleCloseDialog = () => {
    mutate();
    setIsDialogOpen(false);
    setNewEventTitle("");
    setPassword("");
  };

  const handleEventClick = async (selected: EventClickArg) => {
    const password = window.prompt("予約Passwordを入力してください。");
    if (password && window.confirm(`この予約を削除してもよろしいですか?`)) {
      const response = await fetch(`/api/reservation/${selected.event.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(password),
      });

      const data = await response.json();

      if (!data.success) {
        alert("予約Passwordが一致しません。");
      }

      if (data.success) {
        alert(data.message);

        await mutate();

        // key를 변경하여 캘린더 강제 리렌더링
        setCalendarKey((prevKey) => prevKey + 1);
      }
    }
  };

  const isFutureTime = (selectInfo: DateSpanApi) => {
    const now = new Date(); // 현재 시간
    const selectedStart = selectInfo.start;
    const selectedEnd = selectInfo.end;

    // 오늘 날짜 및 현재 시간보다 이전 시간인지 확인
    if (selectedStart < now) {
      return false;
    }

    // 선택된 시간이 1시간을 넘는지 확인
    const duration =
      (selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60); // 시간 단위로 계산
    if (duration > 1) {
      return false;
    }

    return true; // 현재 또는 미래 시간이면서 1시간 이하일 경우에만 true 반환
  };

  // 오늘 날짜를 지정하는 함수
  const getTodayInTokyo = () => {
    const now = new Date();
    now.setHours(now.getHours() + 9); // 일본 표준시 기준으로 9시간 추가
    return now.toISOString().split("T")[0]; // "YYYY-MM-DD" 형식으로 반환
  };

  if (isLoading) {
    return (
      <div className="h-[70vh] flex justify-center items-center">
        <Loader2 className="animate-spin" size={30} />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <div className="min-w-[400px] text-xs md:text-base">
        <FullCalendar
          validRange={{
            start: getTodayInTokyo(), // 일본 표준시 기준으로 오늘 날짜로 시작일 설정
          }}
          allDaySlot={false}
          selectAllow={isFutureTime}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          slotDuration="01:00:00"
          locale={"ja"}
          contentHeight={"auto"}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
          initialView={"timeGridWeek"}
          editable={false}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          select={handleDateClick}
          eventClick={handleEventClick}
          key={calendarKey}
          initialEvents={data && data.reservations}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新しい予約を作成</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col space-y-4" onSubmit={handleAddEvent}>
            <input
              type="text"
              placeholder="バンド名"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
              className="border border-gray-300 p-3 rounded-md text-md"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-gray-300 p-3 rounded-md text-md"
            />
            <button
              className="bg-blue-500 transition hover:bg-blue-500/90 text-white p-3 rounded-md"
              type="submit"
            >
              保存
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
