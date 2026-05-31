import { useState } from "react";
import Icon from "@/components/ui/icon";

type Section = "generator" | "modes" | "history" | "help" | "settings" | "profile";

const MODES = [
  { id: "realistic", emoji: "🎨", label: "Реализм", desc: "Фотореалистичные изображения", color: "from-violet-500 to-purple-600" },
  { id: "anime", emoji: "✨", label: "Аниме", desc: "Японский анимационный стиль", color: "from-pink-500 to-rose-600" },
  { id: "abstract", emoji: "🌀", label: "Абстракция", desc: "Абстрактное искусство", color: "from-cyan-500 to-blue-600" },
  { id: "fantasy", emoji: "🔮", label: "Фэнтези", desc: "Магические миры и существа", color: "from-emerald-500 to-teal-600" },
  { id: "portrait", emoji: "👤", label: "Портрет", desc: "Детальные портреты", color: "from-amber-500 to-orange-600" },
  { id: "landscape", emoji: "🏔️", label: "Пейзаж", desc: "Природные ландшафты", color: "from-sky-500 to-indigo-600" },
];

const HISTORY = [
  { id: 1, prompt: "Космический кот на луне в стиле аниме", mode: "Аниме", time: "2 мин назад", emoji: "🐱" },
  { id: 2, prompt: "Волшебный лес на закате с феями", mode: "Фэнтези", time: "15 мин назад", emoji: "🌲" },
  { id: 3, prompt: "Портрет киберпанк-девушки с неоновыми огнями", mode: "Реализм", time: "1 час назад", emoji: "👩" },
  { id: 4, prompt: "Абстрактный вихрь из звёзд и планет", mode: "Абстракция", time: "3 часа назад", emoji: "🌌" },
];

const FILTERS = [
  { emoji: "🌅", label: "Золотой час" },
  { emoji: "🌙", label: "Ночная съёмка" },
  { emoji: "🎭", label: "Драматическое" },
  { emoji: "🌸", label: "Пастель" },
  { emoji: "⚡", label: "Динамика" },
  { emoji: "🎪", label: "Сюрреализм" },
  { emoji: "🔥", label: "Огненное" },
  { emoji: "❄️", label: "Ледяное" },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>("generator");
  const [selectedMode, setSelectedMode] = useState("realistic");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", text: "Привет! 👋 Я GeminiBot — твой AI-помощник для генерации изображений. Напиши мне что угодно или используй меню ниже!" },
  ]);
  const [isPremium] = useState(false);
  const [usedLimit, setUsedLimit] = useState(7);
  const totalLimit = isPremium ? 999 : 10;

  const navItems: { id: Section; emoji: string; label: string }[] = [
    { id: "generator", emoji: "🎨", label: "Генератор" },
    { id: "modes", emoji: "⚙️", label: "Режимы" },
    { id: "history", emoji: "🕐", label: "История" },
    { id: "help", emoji: "💡", label: "Помощь" },
    { id: "settings", emoji: "🔧", label: "Настройки" },
    { id: "profile", emoji: "👤", label: "Профиль" },
  ];

  const toggleFilter = (f: string) => {
    setSelectedFilters(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const handleGenerate = () => {
    if (!prompt.trim() || usedLimit >= totalLimit) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setUsedLimit(prev => prev + 1);
    }, 2500);
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { role: "bot", text: "🤖 Понял! Чтобы создать изображение — перейди в раздел «Генератор» и введи промт. Я помогу улучшить его по запросу!" }
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center p-4">
      {/* Phone frame */}
      <div
        className="w-full max-w-sm h-[780px] bg-[hsl(225_18%_8%)] rounded-[2.5rem] border border-[hsl(225_15%_16%)] flex flex-col overflow-hidden relative"
        style={{ boxShadow: "0 0 60px hsla(262,83%,65%,0.08), 0 30px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl shimmer-btn flex items-center justify-center text-xl font-black">
              🤖
            </div>
            <div>
              <div className="font-bold text-sm text-white">GeminiBot</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse-glow"></span>
                Online
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPremium && (
              <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
                ⭐ PRO
              </span>
            )}
            <button className="w-8 h-8 rounded-xl bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] flex items-center justify-center text-sm hover:border-[hsl(262_83%_65%/0.5)] transition-colors">
              <Icon name="MoreHorizontal" size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Limit bar */}
        <div className="mx-4 mb-3 p-3 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] flex-shrink-0">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">⚡ Лимит генераций</span>
            <span className={`font-semibold ${usedLimit >= totalLimit ? "text-red-400" : "text-[hsl(262_83%_65%)]"}`}>
              {usedLimit}/{totalLimit}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[hsl(225_15%_16%)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(usedLimit / totalLimit) * 100}%`,
                background: usedLimit / totalLimit > 0.8
                  ? "linear-gradient(90deg, hsl(0 84% 60%), hsl(30 100% 60%))"
                  : "linear-gradient(90deg, hsl(262 83% 65%), hsl(180 100% 50%))"
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">

          {/* GENERATOR */}
          {activeSection === "generator" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-2">
                <div className="text-2xl mb-1 animate-float inline-block">🎨</div>
                <h2 className="text-base font-bold text-white">Генератор изображений</h2>
                <p className="text-xs text-muted-foreground">Опиши что хочешь создать</p>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)]">
                <span className="text-base">{MODES.find(m => m.id === selectedMode)?.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground">Режим: </span>
                  <span className="text-xs font-semibold text-white">{MODES.find(m => m.id === selectedMode)?.label}</span>
                </div>
                <button
                  onClick={() => setActiveSection("modes")}
                  className="text-xs text-[hsl(262_83%_65%)] hover:text-[hsl(180_100%_60%)] transition-colors font-medium"
                >
                  Сменить →
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Опиши изображение... например: «Космонавт в джунглях, неоновые огни, аниме стиль»"
                  className="w-full h-28 p-3.5 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[hsl(262_83%_65%/0.6)] transition-colors leading-relaxed"
                />
                <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">{prompt.length}/500</span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">🎛️ Фильтры стиля</p>
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map(f => (
                    <button
                      key={f.label}
                      onClick={() => toggleFilter(f.label)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-200 font-medium ${
                        selectedFilters.includes(f.label)
                          ? "bg-[hsl(262_83%_65%/0.2)] border-[hsl(262_83%_65%/0.6)] text-[hsl(262_83%_80%)]"
                          : "bg-[hsl(225_15%_11%)] border-[hsl(225_15%_16%)] text-muted-foreground hover:border-[hsl(262_83%_65%/0.3)]"
                      }`}
                    >
                      {f.emoji} {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating || usedLimit >= totalLimit}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isGenerating
                    ? "linear-gradient(90deg, hsl(262 83% 50%), hsl(180 100% 40%))"
                    : "linear-gradient(135deg, hsl(262 83% 65%), hsl(180 100% 50%))",
                  boxShadow: "0 4px 24px hsla(262,83%,65%,0.35)"
                }}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block"></span>
                    Генерирую...
                  </span>
                ) : usedLimit >= totalLimit ? (
                  "🔒 Лимит исчерпан — нужен Premium"
                ) : (
                  "✨ Сгенерировать"
                )}
              </button>

              {usedLimit >= totalLimit && (
                <button className="w-full py-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors">
                  ⭐ Получить Premium
                </button>
              )}
            </div>
          )}

          {/* MODES */}
          {activeSection === "modes" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-2">
                <div className="text-2xl mb-1">⚙️</div>
                <h2 className="text-base font-bold text-white">Режимы генерации</h2>
                <p className="text-xs text-muted-foreground">Выбери стиль изображения</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {MODES.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMode(m.id); setActiveSection("generator"); }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 animate-fade-in ${
                      selectedMode === m.id
                        ? "border-[hsl(262_83%_65%/0.7)] bg-[hsl(262_83%_65%/0.12)]"
                        : "border-[hsl(225_15%_15%)] bg-[hsl(225_15%_11%)] hover:border-[hsl(262_83%_65%/0.35)]"
                    }`}
                    style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
                  >
                    <div className="text-2xl mb-2">{m.emoji}</div>
                    <div className="text-sm font-bold text-white">{m.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{m.desc}</div>
                    {selectedMode === m.id && (
                      <div className="mt-2 text-xs text-[hsl(262_83%_75%)] font-semibold">✓ Выбрано</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* HISTORY */}
          {activeSection === "history" && (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h2 className="text-base font-bold text-white">🕐 История</h2>
                  <p className="text-xs text-muted-foreground">{HISTORY.length} генерации</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1.5 rounded-xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] text-muted-foreground hover:text-white transition-colors">
                    📤 Экспорт
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors">
                    🗑️ Очистить
                  </button>
                </div>
              </div>
              <div className="space-y-2.5">
                {HISTORY.map((item, i) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] animate-fade-in hover:border-[hsl(262_83%_65%/0.3)] transition-colors cursor-pointer"
                    style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(225_15%_16%)] flex items-center justify-center text-xl flex-shrink-0">
                        {item.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium leading-snug line-clamp-2">{item.prompt}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-[hsl(262_83%_65%/0.15)] text-[hsl(262_83%_75%)] font-medium">
                            {item.mode}
                          </span>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                      </div>
                      <button className="text-muted-foreground hover:text-[hsl(262_83%_65%)] transition-colors">
                        <Icon name="RotateCcw" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HELP */}
          {activeSection === "help" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-2">
                <div className="text-2xl mb-1">💡</div>
                <h2 className="text-base font-bold text-white">Помощь</h2>
                <p className="text-xs text-muted-foreground">Как пользоваться ботом</p>
              </div>

              <div className="bg-[hsl(225_15%_11%)] rounded-2xl border border-[hsl(225_15%_15%)] overflow-hidden">
                <div className="p-3 border-b border-[hsl(225_15%_15%)] flex items-center gap-2">
                  <span className="text-sm">🤖</span>
                  <span className="text-xs font-semibold text-white">Спроси меня</span>
                  <span className="text-xs text-emerald-400 ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-glow"></span>
                    Онлайн
                  </span>
                </div>
                <div className="h-36 overflow-y-auto p-3 space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-[hsl(262_83%_65%)] to-[hsl(180_100%_50%)] text-white rounded-br-sm"
                          : "bg-[hsl(225_15%_16%)] text-white rounded-bl-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[hsl(225_15%_15%)] flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleChat()}
                    placeholder="Задай вопрос..."
                    className="flex-1 text-xs bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] rounded-xl px-3 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(262_83%_65%/0.5)]"
                  />
                  <button
                    onClick={handleChat}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 65%), hsl(180 100% 50%))" }}
                  >
                    <Icon name="Send" size={12} />
                  </button>
                </div>
              </div>

              {[
                { emoji: "📝", title: "Чёткий промт", text: "Описывай детали: стиль, цвета, освещение, настроение" },
                { emoji: "🎨", title: "Выбирай режим", text: "Разные режимы дают разный результат для одного промта" },
                { emoji: "🎛️", title: "Используй фильтры", text: "Фильтры добавляют атмосферу и уточняют стиль" },
                { emoji: "⭐", title: "Premium", text: "Безлимитные генерации и приоритетная очередь" },
              ].map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)]">
                  <span className="text-xl flex-shrink-0">{tip.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{tip.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tip.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS */}
          {activeSection === "settings" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-2">
                <div className="text-2xl mb-1">🔧</div>
                <h2 className="text-base font-bold text-white">Настройки</h2>
              </div>

              {[
                { emoji: "🔑", label: "API-ключ Gemini", value: "Не настроен", action: "Добавить", danger: false },
                { emoji: "🌍", label: "Язык ответов", value: "Русский", action: "Изменить", danger: false },
                { emoji: "📐", label: "Размер изображений", value: "1024×1024", action: "Изменить", danger: false },
                { emoji: "💾", label: "Сохранять в историю", value: "Включено", action: "Выкл.", danger: false },
                { emoji: "🗑️", label: "Очистить историю", value: "4 записи", action: "Очистить", danger: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)]">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                  <button className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                    item.danger
                      ? "border-red-500/40 text-red-400 hover:bg-red-500/10"
                      : "border-[hsl(262_83%_65%/0.4)] text-[hsl(262_83%_75%)] hover:bg-[hsl(262_83%_65%/0.1)]"
                  }`}>
                    {item.action}
                  </button>
                </div>
              ))}

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⭐</span>
                  <p className="text-sm font-bold text-amber-400">Premium Plan</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Безлимитные генерации, приоритет в очереди, эксклюзивные режимы</p>
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(30 100% 55%), hsl(45 100% 60%))" }}
                >
                  Подключить Premium
                </button>
              </div>
            </div>
          )}

          {/* PROFILE */}
          {activeSection === "profile" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-3">
                <div className="w-20 h-20 rounded-3xl mx-auto mb-3 flex items-center justify-center text-4xl shimmer-btn">
                  👤
                </div>
                <h2 className="text-base font-bold text-white">@user_123</h2>
                <p className="text-xs text-muted-foreground">Пользователь с 31 мая 2026</p>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full mt-2 font-semibold">
                    ⭐ Premium
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: "🎨", label: "Генераций", value: usedLimit.toString() },
                  { emoji: "🕐", label: "В истории", value: HISTORY.length.toString() },
                  { emoji: "⭐", label: "Статус", value: isPremium ? "PRO" : "Free" },
                ].map((stat, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] text-center">
                    <div className="text-xl mb-1">{stat.emoji}</div>
                    <div className="text-base font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {[
                { emoji: "📤", label: "Экспорт истории", desc: "Скачать все генерации в ZIP" },
                { emoji: "🔗", label: "Реферальная ссылка", desc: "Пригласи друга — получи генерации" },
                { emoji: "📊", label: "Статистика", desc: "Детальная аналитика использования" },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] hover:border-[hsl(262_83%_65%/0.35)] transition-colors text-left">
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                </button>
              ))}

              {!isPremium && (
                <button
                  className="w-full py-4 rounded-2xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, hsl(30 100% 55%), hsl(45 100% 60%))", boxShadow: "0 4px 24px hsla(30,100%,55%,0.3)" }}
                >
                  ⭐ Перейти на Premium
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="px-3 pb-4 pt-2 flex-shrink-0">
          <div className="bg-[hsl(225_15%_10%)] border border-[hsl(225_15%_15%)] rounded-2xl p-1.5 grid grid-cols-6 gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl transition-all duration-200 ${
                  activeSection === item.id
                    ? "bg-gradient-to-b from-[hsl(262_83%_65%/0.25)] to-[hsl(262_83%_65%/0.1)] border border-[hsl(262_83%_65%/0.4)]"
                    : "hover:bg-[hsl(225_15%_14%)]"
                }`}
              >
                <span className="text-base leading-none">{item.emoji}</span>
                <span className={`text-[9px] font-medium leading-none ${
                  activeSection === item.id ? "text-[hsl(262_83%_75%)]" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, hsl(262 83% 65%), transparent)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, hsl(180 100% 50%), transparent)", filter: "blur(60px)" }} />
      </div>
    </div>
  );
}
