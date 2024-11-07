import Calendar from "@/components/Calendar";

export default function Home() {
  return (
    <div className="p-5">
      <p className="mb-4 text-center font-black text-xl text-red-500">⚠ 必読</p>
      <div className="mb-6 bg-red-500 p-3 text-center font-bold text-white text-sm">
        <p>
          ・
          一日中、1バンドあたりの最大利用時間は2時間までとなります。ご理解のほど、よろしくお願いいたします。
        </p>
        <p className="mt-2">
          ・ 2時間以上ご予約の方は、1時間ずつ予約入力をお願いいたします。
        </p>
      </div>
      <Calendar />
    </div>
  );
}
