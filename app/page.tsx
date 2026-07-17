"use client";

import { useMemo, useState } from "react";

const soupBases = ["重庆牛油红汤", "番茄鸳鸯锅", "菌汤鸳鸯锅", "藤椒麻辣锅"];
const dishes = [
  "毛肚",
  "鸭肠",
  "黄喉",
  "午餐肉",
  "嫩牛肉",
  "虾滑",
  "酥肉",
  "贡菜",
  "豆皮",
  "金针菇",
  "土豆片",
  "宽粉",
];
const times = ["11:30", "12:00", "17:30", "18:00", "18:30", "19:00", "19:30"];

export default function Home() {
  const [step, setStep] = useState(0);
  const [selectedSoup, setSelectedSoup] = useState(soupBases[0]);
  const [selectedDishes, setSelectedDishes] = useState<string[]>(["毛肚", "虾滑"]);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const [date, setDate] = useState("");
  const [time, setTime] = useState(times[3]);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [sendMessage, setSendMessage] = useState("");

  const progress = useMemo(() => `${step + 1}/6`, [step]);

  const toggleDish = (dish: string) => {
    setSelectedDishes((current) =>
      current.includes(dish)
        ? current.filter((item) => item !== dish)
        : [...current, dish],
    );
  };

  const dodgeNoButton = () => {
    setNoPosition({
      x: Math.round(Math.random() * 180 - 90),
      y: Math.round(Math.random() * 120 - 60),
    });
  };

  const createDateCard = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("无法生成图片");
    }

    const gradient = context.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, "#fff6e8");
    gradient.addColorStop(0.55, "#ffd9dd");
    gradient.addColorStop(1, "#dff5d7");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 800);

    context.fillStyle = "rgba(255, 255, 255, 0.76)";
    context.roundRect(96, 90, 1008, 620, 36);
    context.fill();

    context.fillStyle = "#8f2238";
    context.font = "bold 72px Arial, sans-serif";
    context.fillText("约会信息卡", 160, 190);

    context.fillStyle = "#bd2846";
    context.font = "bold 42px Arial, sans-serif";
    context.fillText("吃货就位，快乐加倍", 160, 260);

    context.fillStyle = "#3b2724";
    context.font = "34px Arial, sans-serif";
    const lines = [
      `锅底：${selectedSoup}`,
      `配菜：${selectedDishes.length ? selectedDishes.join("、") : "还没选配菜"}`,
      `散步：接受`,
      `日期：${date || "未选择"}`,
      `时间：${time}`,
    ];

    lines.forEach((line, index) => {
      context.fillText(line, 160, 360 + index * 70);
    });

    context.fillStyle = "#2f8f63";
    context.font = "bold 30px Arial, sans-serif";
    context.fillText("重庆火锅约会计划已生成", 160, 675);

    return canvas.toDataURL("image/png");
  };

  const finishAndSend = async () => {
    if (!date) {
      setSendStatus("failed");
      setSendMessage("请先选择约会日期。");
      return;
    }

    setStep(5);
    setSendStatus("sending");
    setSendMessage("正在生成图片并发送到邮箱...");

    try {
      const cardImage = createDateCard();
      const response = await fetch("/api/send-date-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: "18640865859@163.com",
          image: cardImage,
          date,
          time,
          soup: selectedSoup,
          dishes: selectedDishes,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error || "发送失败");
      }

      setSendStatus("sent");
      setSendMessage("约会信息图片已经发送到邮箱。");
    } catch (error) {
      setSendStatus("failed");
      setSendMessage(error instanceof Error ? error.message : "发送失败，请稍后再试。");
    }
  };

  return (
    <main className={`date-app step-${step}`}>
      <div className="progress-pill">{progress}</div>

      {step === 0 && (
        <section className="screen intro-screen" aria-label="约会邀请">
          <div className="flower-field" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="intro-copy">
            <p className="eyebrow">今天的计划已经准备好啦</p>
            <h1>我们一起去约会吧！</h1>
          </div>
          <button className="primary-button" onClick={() => setStep(1)}>
            继续
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="screen hotpot-guide" aria-label="火锅第一步">
          <div className="content-panel">
            <p className="eyebrow">第一步</p>
            <h2>我们去吃火锅</h2>
            <p>
              请选择你喜欢的锅底与配菜。选好以后点击下一步，我们就正式进入重庆火锅点单时间。
            </p>
            <div className="mini-hotpot" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <button className="primary-button" onClick={() => setStep(2)}>
              下一步
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="screen menu-screen" aria-label="重庆火锅选择">
          <div className="content-panel wide">
            <p className="eyebrow">重庆火锅</p>
            <h2>锅底与配菜</h2>
            <p className="hint">每一个选项都可以单独点击，喜欢什么就选什么。</p>

            <div className="option-block">
              <h3>锅底</h3>
              <div className="button-grid">
                {soupBases.map((base) => (
                  <button
                    className={selectedSoup === base ? "choice active" : "choice"}
                    key={base}
                    onClick={() => setSelectedSoup(base)}
                  >
                    {base}
                  </button>
                ))}
              </div>
            </div>

            <div className="option-block">
              <h3>配菜</h3>
              <div className="button-grid">
                {dishes.map((dish) => (
                  <button
                    className={selectedDishes.includes(dish) ? "choice active" : "choice"}
                    key={dish}
                    onClick={() => toggleDish(dish)}
                  >
                    {dish}
                  </button>
                ))}
              </div>
            </div>

            <p className="summary">
              已选：{selectedSoup} · {selectedDishes.length || 0} 个配菜
            </p>
            <button className="primary-button" onClick={() => setStep(3)}>
              下一步
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="screen walk-screen" aria-label="散步邀请">
          <div className="walk-overlay">
            <p className="eyebrow">吃饱以后</p>
            <h2>我们去散步吧。</h2>
            <div className="walk-actions">
              <button className="primary-button" onClick={() => setStep(4)}>
                接受
              </button>
              <button
                className="secondary-button dodge"
                style={{
                  transform: `translate(${noPosition.x}px, ${noPosition.y}px)`,
                }}
                onMouseEnter={dodgeNoButton}
                onFocus={dodgeNoButton}
                onClick={dodgeNoButton}
              >
                拒绝
              </button>
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="screen schedule-screen" aria-label="约会日期选择">
          <div className="content-panel">
            <p className="eyebrow">约会时间</p>
            <h2>选择具体日期和时间点</h2>
            <label className="field">
              <span>日期</span>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <div className="option-block">
              <h3>时间点</h3>
              <div className="button-grid compact">
                {times.map((slot) => (
                  <button
                    className={time === slot ? "choice active" : "choice"}
                    key={slot}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <p className="summary">
              {date ? `就定在 ${date} ${time}` : `先选一天，再定 ${time}`}
            </p>
            {sendStatus === "failed" && <p className="error-text">{sendMessage}</p>}
            <button className="primary-button" onClick={finishAndSend}>
              完成
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="screen done-screen" aria-label="完成">
          <div className="celebration">
            <p>吃货就位。</p>
            <p>快乐加倍。</p>
          </div>
          <p className={`send-status ${sendStatus}`}>
            {sendMessage || "约会信息图片准备发送到邮箱。"}
          </p>
          <button className="secondary-button" onClick={() => setStep(0)}>
            再看一遍
          </button>
        </section>
      )}
    </main>
  );
}
