import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const GEMINI_URL = "https://functions.poehali.dev/4cb42486-5daf-4535-8a8d-d11b08e318f8";

type Section = "generator" | "modes" | "history" | "help" | "settings" | "profile" | "styles" | "admin";

// Gemini models
const MODELS = [
  {
    id: "gemini-3.1-flash-lite",
    emoji: "⚡",
    label: "3.1 Flash-Lite",
    badge: "Новинка",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    desc: "Самые быстрые ответы",
    speed: "Молниеносно",
    cost: "Экономно",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "gemini-3.5-flash",
    emoji: "🚀",
    label: "3.5 Flash",
    badge: "Новинка",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    desc: "All-around help",
    speed: "Быстро",
    cost: "Оптимально",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    id: "gemini-3.1-pro",
    emoji: "🔮",
    label: "3.1 Pro",
    badge: "Pro",
    badgeColor: "bg-violet-500/20 text-violet-400 border-violet-500/40",
    desc: "Сложные математические задачи и многое другое",
    speed: "Умно",
    cost: "Премиум",
    gradient: "from-violet-500 to-purple-600",
  },
];

// Default styles (admin can add more)
const DEFAULT_STYLES: Style[] = [
  { id: "1", category: "Арт", name: "Акварель", emoji: "🎨", prompt: "watercolor painting style, soft edges, flowing colors" },
  { id: "2", category: "Арт", name: "Масло", emoji: "🖼️", prompt: "oil painting style, rich textures, classical art" },
  { id: "3", category: "Арт", name: "Аниме", emoji: "✨", prompt: "anime style, vibrant colors, detailed linework" },
  { id: "4", category: "Фото", name: "Кинематограф", emoji: "🎬", prompt: "cinematic photography, dramatic lighting, film grain" },
  { id: "5", category: "Фото", name: "Портрет", emoji: "📸", prompt: "professional portrait photography, bokeh, soft light" },
  { id: "6", category: "3D", name: "Рендер", emoji: "💎", prompt: "3D render, octane render, photorealistic, studio lighting" },
  { id: "7", category: "3D", name: "Пиксель-арт", emoji: "👾", prompt: "pixel art style, 8-bit, retro game aesthetic" },
  { id: "8", category: "Фэнтези", name: "Магия", emoji: "🔮", prompt: "fantasy magic art, glowing runes, mystical atmosphere" },
];

interface Style {
  id: string;
  category: string;
  name: string;
  emoji: string;
  prompt: string;
}

interface HistoryItem {
  id: number;
  prompt: string;
  model: string;
  time: string;
  emoji: string;
  imageBase64?: string;
  mimeType?: string;
}

const ADMIN_PASSWORD = "admin123";

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>("generator");
  const [selectedModel, setSelectedModel] = useState("gemini-3.5-flash");
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [isPremium] = useState(false);
  const [usedLimit, setUsedLimit] = useState(0);
  const totalLimit = isPremium ? 999 : 10;

  // Result
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedMime, setGeneratedMime] = useState("image/png");
  const [generateError, setGenerateError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Styles state
  const [styles, setStyles] = useState<Style[]>(DEFAULT_STYLES);
  const [styleTab, setStyleTab] = useState("Арт");

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [newStyle, setNewStyle] = useState<Partial<Style>>({ category: "Арт", emoji: "🎨" });

  // Chat
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "bot", text: "Привет! 👋 Я GeminiBot — твой AI-помощник на базе Gemini. Задай любой вопрос или перейди в «Создать» для генерации изображений!" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const navItems: { id: Section; emoji: string; label: string }[] = [
    { id: "generator", emoji: "🎨", label: "Создать" },
    { id: "styles", emoji: "🖼️", label: "Стили" },
    { id: "modes", emoji: "⚡", label: "Модели" },
    { id: "history", emoji: "🕐", label: "История" },
    { id: "help", emoji: "💬", label: "Чат" },
    { id: "profile", emoji: "👤", label: "Профиль" },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim() || usedLimit >= totalLimit) return;
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedImage(null);

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          style_prompt: selectedStyle?.prompt ?? "",
          image_base64: uploadedPhoto ?? undefined,
          mode: "image",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error ?? "Ошибка генерации");
        return;
      }

      if (data.type === "image" && data.image_base64) {
        const mime = data.mime_type ?? "image/png";
        const src = `data:${mime};base64,${data.image_base64}`;
        setGeneratedImage(src);
        setGeneratedMime(mime);
        setUsedLimit(prev => prev + 1);
        const newItem: HistoryItem = {
          id: Date.now(),
          prompt,
          model: MODELS.find(m => m.id === selectedModel)?.label ?? selectedModel,
          time: "только что",
          emoji: selectedStyle?.emoji ?? "🎨",
          imageBase64: data.image_base64,
          mimeType: mime,
        };
        setHistory(prev => [newItem, ...prev]);
      } else if (data.text) {
        setGenerateError(`Gemini ответил текстом: ${data.text}`);
      } else {
        setGenerateError("Изображение не получено — попробуй изменить промт");
      }
    } catch {
      setGenerateError("Сетевая ошибка — проверь подключение");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setUploadedPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const msg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);
    setIsChatLoading(true);

    try {
      const res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: msg, mode: "chat" }),
      });
      const data = await res.json();
      const reply = data.text ?? data.error ?? "Не удалось получить ответ";
      setChatMessages(prev => [...prev, { role: "bot", text: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "bot", text: "⚠️ Ошибка соединения с Gemini" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminError("");
      setActiveSection("admin");
    } else {
      setAdminError("Неверный пароль");
    }
  };

  const addStyle = () => {
    if (!newStyle.name || !newStyle.category || !newStyle.prompt) return;
    setStyles(prev => [...prev, { ...newStyle, id: Date.now().toString() } as Style]);
    setNewStyle({ category: newStyle.category, emoji: "🎨" });
  };

  const deleteStyle = (id: string) => {
    setStyles(prev => prev.filter(s => s.id !== id));
  };

  const categories = [...new Set(styles.map(s => s.category))];
  const currentModel = MODELS.find(m => m.id === selectedModel)!;

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col items-center justify-center p-4">
      <div
        className="w-full max-w-sm h-[800px] bg-[hsl(225_18%_8%)] rounded-[2.5rem] border border-[hsl(225_15%_16%)] flex flex-col overflow-hidden relative"
        style={{ boxShadow: "0 0 60px hsla(262,83%,65%,0.08), 0 30px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl shimmer-btn flex items-center justify-center text-xl">🤖</div>
            <div>
              <div className="font-bold text-sm text-white">GeminiBot</div>
              <div className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse-glow"></span>
                {currentModel.label}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setActiveSection("admin")}
                className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-semibold"
              >
                🛡️ Админ
              </button>
            )}
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
                width: `${Math.min((usedLimit / totalLimit) * 100, 100)}%`,
                background: usedLimit / totalLimit > 0.8
                  ? "linear-gradient(90deg, hsl(0 84% 60%), hsl(30 100% 60%))"
                  : "linear-gradient(90deg, hsl(262 83% 65%), hsl(180 100% 50%))"
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-2">

          {/* ===== GENERATOR ===== */}
          {activeSection === "generator" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-1">
                <div className="text-2xl mb-1 animate-float inline-block">🎨</div>
                <h2 className="text-base font-bold text-white">Генератор изображений</h2>
                <p className="text-xs text-muted-foreground">Промт + фото → AI создаст шедевр</p>
              </div>

              {/* Model + Style badges */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveSection("modes")}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] hover:border-[hsl(262_83%_65%/0.4)] transition-colors"
                >
                  <span className="text-base">{currentModel.emoji}</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground">Модель</div>
                    <div className="text-xs font-semibold text-white truncate">{currentModel.label}</div>
                  </div>
                  <Icon name="ChevronRight" size={12} className="text-muted-foreground flex-shrink-0" />
                </button>
                <button
                  onClick={() => setActiveSection("styles")}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] hover:border-[hsl(262_83%_65%/0.4)] transition-colors"
                >
                  <span className="text-base">{selectedStyle?.emoji ?? "🖼️"}</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-[10px] text-muted-foreground">Стиль</div>
                    <div className="text-xs font-semibold text-white truncate">{selectedStyle?.name ?? "Не выбран"}</div>
                  </div>
                  <Icon name="ChevronRight" size={12} className="text-muted-foreground flex-shrink-0" />
                </button>
              </div>

              {/* Photo upload */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">📎 Твоё фото (необязательно)</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                {uploadedPhoto ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[hsl(262_83%_65%/0.4)]">
                    <img src={uploadedPhoto} alt="uploaded" className="w-full h-28 object-cover" />
                    <button
                      onClick={() => setUploadedPhoto(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    >
                      <Icon name="X" size={12} />
                    </button>
                    <div className="absolute bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded-lg">
                      ✅ Фото загружено
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-20 rounded-2xl border-2 border-dashed border-[hsl(225_15%_18%)] bg-[hsl(225_15%_10%)] flex flex-col items-center justify-center gap-1 hover:border-[hsl(262_83%_65%/0.5)] hover:bg-[hsl(262_83%_65%/0.04)] transition-all group"
                  >
                    <Icon name="Upload" size={18} className="text-muted-foreground group-hover:text-[hsl(262_83%_65%)] transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">Нажми чтобы добавить фото</span>
                  </button>
                )}
              </div>

              {/* Prompt */}
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value.slice(0, 500))}
                  placeholder={uploadedPhoto
                    ? "Опиши что сделать с фото... «Превратить в аниме-персонажа»"
                    : "Опиши изображение... «Космонавт в джунглях, неоновые огни»"
                  }
                  className="w-full h-24 p-3.5 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] text-sm text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[hsl(262_83%_65%/0.6)] transition-colors leading-relaxed"
                />
                <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">{prompt.length}/500</span>
              </div>

              {/* Generate button */}
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
                    Генерирую через {currentModel.label}...
                  </span>
                ) : usedLimit >= totalLimit ? (
                  "🔒 Лимит исчерпан — нужен Premium"
                ) : (
                  `✨ Сгенерировать${selectedStyle ? ` в стиле ${selectedStyle.name}` : ""}`
                )}
              </button>

              {/* Error */}
              {generateError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 leading-relaxed animate-fade-in">
                  ⚠️ {generateError}
                </div>
              )}

              {/* Result image */}
              {generatedImage && (
                <div className="animate-scale-in rounded-2xl overflow-hidden border border-[hsl(262_83%_65%/0.5)] relative">
                  <img
                    src={generatedImage}
                    alt="Сгенерированное изображение"
                    className="w-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                    <span className="text-xs text-white/80">✨ {currentModel.label}</span>
                    <a
                      href={generatedImage}
                      download={`gemini-${Date.now()}.png`}
                      className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl transition-colors font-medium"
                    >
                      <Icon name="Download" size={11} />
                      Скачать
                    </a>
                  </div>
                </div>
              )}

              {usedLimit >= totalLimit && (
                <button className="w-full py-3 rounded-2xl border border-amber-500/50 bg-amber-500/10 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors">
                  ⭐ Получить Premium — безлимит
                </button>
              )}
            </div>
          )}

          {/* ===== STYLES ===== */}
          {activeSection === "styles" && (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <h2 className="text-base font-bold text-white">🖼️ Стили</h2>
                  <p className="text-xs text-muted-foreground">{styles.length} стилей от автора</p>
                </div>
                {selectedStyle && (
                  <button
                    onClick={() => setSelectedStyle(null)}
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    Сбросить
                  </button>
                )}
              </div>

              {/* Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setStyleTab(cat)}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                      styleTab === cat
                        ? "bg-[hsl(262_83%_65%/0.2)] border-[hsl(262_83%_65%/0.6)] text-[hsl(262_83%_80%)]"
                        : "bg-[hsl(225_15%_11%)] border-[hsl(225_15%_15%)] text-muted-foreground hover:border-[hsl(262_83%_65%/0.3)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Style cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {styles.filter(s => s.category === styleTab).map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedStyle(s); setActiveSection("generator"); }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 animate-fade-in ${
                      selectedStyle?.id === s.id
                        ? "border-[hsl(262_83%_65%/0.7)] bg-[hsl(262_83%_65%/0.12)]"
                        : "border-[hsl(225_15%_15%)] bg-[hsl(225_15%_11%)] hover:border-[hsl(262_83%_65%/0.35)]"
                    }`}
                    style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}
                  >
                    <div className="text-2xl mb-2">{s.emoji}</div>
                    <div className="text-sm font-bold text-white">{s.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.prompt}</div>
                    {selectedStyle?.id === s.id && (
                      <div className="mt-2 text-xs text-[hsl(262_83%_75%)] font-semibold">✓ Выбран</div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveSection("generator")}
                className="w-full py-3 rounded-2xl font-semibold text-sm text-white transition-all"
                style={{ background: "linear-gradient(135deg, hsl(262 83% 65%), hsl(180 100% 50%))" }}
              >
                {selectedStyle ? `✓ Выбран: ${selectedStyle.name} → Создать` : "Продолжить без стиля →"}
              </button>
            </div>
          )}

          {/* ===== MODELS ===== */}
          {activeSection === "modes" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-1">
                <div className="text-2xl mb-1">⚡</div>
                <h2 className="text-base font-bold text-white">Модели Gemini</h2>
                <p className="text-xs text-muted-foreground">Выбери скорость и качество</p>
              </div>

              {/* Gemini logo ref */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)]">
                <img src="https://cdn.poehali.dev/projects/39ffa499-fc0f-4997-a5db-25d1557926fb/bucket/82f9ef1a-c4fc-4450-804d-896ab99ae0c7.png" alt="Gemini" className="w-8 h-8 rounded-xl object-cover opacity-80" />
                <div>
                  <p className="text-xs font-semibold text-white">Google Gemini Pro</p>
                  <p className="text-xs text-muted-foreground">Подключён твой аккаунт</p>
                </div>
                <span className="ml-auto text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-glow"></span>
                  Активен
                </span>
              </div>

              <div className="space-y-2.5">
                {MODELS.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedModel(m.id); setActiveSection("generator"); }}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 animate-fade-in ${
                      selectedModel === m.id
                        ? "border-[hsl(262_83%_65%/0.7)] bg-[hsl(262_83%_65%/0.1)]"
                        : "border-[hsl(225_15%_15%)] bg-[hsl(225_15%_11%)] hover:border-[hsl(262_83%_65%/0.35)]"
                    }`}
                    style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-gradient-to-br ${m.gradient} bg-opacity-20`}
                        style={{ background: `linear-gradient(135deg, ${m.gradient.replace("from-", "").replace(" to-", ", ")})`, opacity: 0.9 }}
                      >
                        {m.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{m.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">{m.desc}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-[10px] text-[hsl(262_83%_70%)]">⚡ {m.speed}</span>
                          <span className="text-[10px] text-[hsl(180_100%_50%)]">💎 {m.cost}</span>
                        </div>
                      </div>
                      {selectedModel === m.id && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(262 83% 65%)" }}>
                          <Icon name="Check" size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===== HISTORY ===== */}
          {activeSection === "history" && (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <h2 className="text-base font-bold text-white">🕐 История</h2>
                  <p className="text-xs text-muted-foreground">{history.length} генераций</p>
                </div>
                <button
                  onClick={() => setHistory([])}
                  className="text-xs px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  🗑️ Очистить
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎨</div>
                  <p className="text-sm text-muted-foreground">История пуста</p>
                  <p className="text-xs text-muted-foreground mt-1">Создай первое изображение!</p>
                  <button
                    onClick={() => setActiveSection("generator")}
                    className="mt-4 text-xs px-4 py-2 rounded-xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 65%), hsl(180 100% 50%))" }}
                  >
                    ✨ Создать
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {history.map((item, i) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] animate-fade-in hover:border-[hsl(262_83%_65%/0.3)] transition-colors overflow-hidden"
                      style={{ animationDelay: `${i * 0.06}s`, opacity: 0 }}
                    >
                      {item.imageBase64 && (
                        <div className="relative">
                          <img
                            src={`data:${item.mimeType ?? "image/png"};base64,${item.imageBase64}`}
                            alt={item.prompt}
                            className="w-full h-36 object-cover"
                          />
                          <a
                            href={`data:${item.mimeType ?? "image/png"};base64,${item.imageBase64}`}
                            download={`gemini-${item.id}.png`}
                            className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <Icon name="Download" size={12} />
                          </a>
                        </div>
                      )}
                      <div className="p-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(225_15%_16%)] flex items-center justify-center text-base flex-shrink-0">
                          {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium leading-snug line-clamp-2">{item.prompt}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[hsl(262_83%_65%/0.15)] text-[hsl(262_83%_75%)] font-medium">{item.model}</span>
                            <span className="text-[10px] text-muted-foreground">{item.time}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setPrompt(item.prompt);
                            setActiveSection("generator");
                            setGeneratedImage(null);
                          }}
                          className="text-muted-foreground hover:text-[hsl(262_83%_65%)] transition-colors flex-shrink-0"
                          title="Повторить"
                        >
                          <Icon name="RotateCcw" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeSection === "settings" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-1">
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

              {/* Admin access */}
              {!isAdmin ? (
                <div className="p-4 rounded-2xl bg-[hsl(225_15%_11%)] border border-amber-500/30">
                  <p className="text-sm font-semibold text-amber-400 mb-2">🛡️ Панель администратора</p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={adminInput}
                      onChange={e => setAdminInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
                      placeholder="Пароль администратора"
                      className="flex-1 text-xs bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] rounded-xl px-3 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-amber-500/50"
                    />
                    <button
                      onClick={handleAdminLogin}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, hsl(30 100% 55%), hsl(45 100% 60%))" }}
                    >
                      Войти
                    </button>
                  </div>
                  {adminError && <p className="text-xs text-red-400 mt-1.5">{adminError}</p>}
                </div>
              ) : (
                <button
                  onClick={() => setActiveSection("admin")}
                  className="w-full py-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-400 text-sm font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  🛡️ Открыть панель администратора
                </button>
              )}

              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">⭐</span>
                  <p className="text-sm font-bold text-amber-400">Premium Plan</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Безлимитные генерации, приоритет, все модели</p>
                <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, hsl(30 100% 55%), hsl(45 100% 60%))" }}>
                  Подключить Premium
                </button>
              </div>
            </div>
          )}

          {/* ===== ADMIN PANEL ===== */}
          {activeSection === "admin" && isAdmin && (
            <div className="animate-fade-in space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <h2 className="text-base font-bold text-white">🛡️ Панель админа</h2>
                  <p className="text-xs text-muted-foreground">Управление стилями и категориями</p>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">● Активен</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: "🖼️", label: "Стилей", value: styles.length },
                  { emoji: "📂", label: "Категорий", value: categories.length },
                  { emoji: "👥", label: "Пользов.", value: 42 },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] text-center">
                    <div className="text-xl mb-1">{s.emoji}</div>
                    <div className="text-base font-bold text-white">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Add new style */}
              <div className="p-4 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(262_83%_65%/0.3)] space-y-2.5">
                <p className="text-sm font-bold text-white">➕ Добавить стиль</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newStyle.emoji ?? ""}
                    onChange={e => setNewStyle(p => ({ ...p, emoji: e.target.value }))}
                    placeholder="Эмодзи 🎨"
                    className="text-sm bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] rounded-xl px-3 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(262_83%_65%/0.5)]"
                  />
                  <input
                    value={newStyle.name ?? ""}
                    onChange={e => setNewStyle(p => ({ ...p, name: e.target.value }))}
                    placeholder="Название"
                    className="text-sm bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] rounded-xl px-3 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(262_83%_65%/0.5)]"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    value={newStyle.category ?? ""}
                    onChange={e => setNewStyle(p => ({ ...p, category: e.target.value }))}
                    placeholder="Категория (Арт / Фото / 3D...)"
                    className="flex-1 text-sm bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] rounded-xl px-3 py-2.5 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(262_83%_65%/0.5)]"
                  />
                </div>
                <textarea
                  value={newStyle.prompt ?? ""}
                  onChange={e => setNewStyle(p => ({ ...p, prompt: e.target.value }))}
                  placeholder="Промт стиля на английском... watercolor painting, soft colors"
                  className="w-full h-16 text-sm bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] rounded-xl px-3 py-2.5 text-white placeholder:text-muted-foreground resize-none focus:outline-none focus:border-[hsl(262_83%_65%/0.5)]"
                />
                <button
                  onClick={addStyle}
                  disabled={!newStyle.name || !newStyle.prompt}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
                  style={{ background: "linear-gradient(135deg, hsl(262 83% 65%), hsl(180 100% 50%))" }}
                >
                  ➕ Добавить стиль
                </button>
              </div>

              {/* Existing styles list */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium">Все стили ({styles.length})</p>
                <div className="space-y-2">
                  {styles.map(s => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)]">
                      <span className="text-lg">{s.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.category}</p>
                      </div>
                      <button
                        onClick={() => deleteStyle(s.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Icon name="Trash2" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== PROFILE ===== */}
          {activeSection === "profile" && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-3">
                <div className="w-20 h-20 rounded-3xl mx-auto mb-3 flex items-center justify-center text-4xl shimmer-btn">👤</div>
                <h2 className="text-base font-bold text-white">@user_123</h2>
                <p className="text-xs text-muted-foreground">Пользователь с 31 мая 2026</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { emoji: "🎨", label: "Генераций", value: usedLimit.toString() },
                  { emoji: "🖼️", label: "Стилей", value: styles.length.toString() },
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
                { emoji: "💡", label: "Помощь", desc: "Как пользоваться ботом" },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-[hsl(225_15%_11%)] border border-[hsl(225_15%_15%)] hover:border-[hsl(262_83%_65%/0.35)] transition-colors text-left"
                  onClick={() => item.label === "Помощь" && setActiveSection("help" as Section)}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-muted-foreground" />
                </button>
              ))}
              {!isPremium && (
                <button className="w-full py-4 rounded-2xl font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, hsl(30 100% 55%), hsl(45 100% 60%))", boxShadow: "0 4px 24px hsla(30,100%,55%,0.3)" }}>
                  ⭐ Перейти на Premium
                </button>
              )}
            </div>
          )}

          {/* ===== HELP (hidden section via profile) ===== */}
          {activeSection === ("help" as Section) && (
            <div className="animate-fade-in space-y-3">
              <div className="text-center py-1">
                <div className="text-2xl mb-1">💡</div>
                <h2 className="text-base font-bold text-white">Чат с Gemini</h2>
                <p className="text-xs text-muted-foreground">Реальные ответы от AI</p>
              </div>
              <div className="bg-[hsl(225_15%_11%)] rounded-2xl border border-[hsl(225_15%_15%)] overflow-hidden flex flex-col" style={{ height: "420px" }}>
                <div className="p-3 border-b border-[hsl(225_15%_15%)] flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm">🤖</span>
                  <span className="text-xs font-semibold text-white">Gemini AI</span>
                  <span className="text-xs text-emerald-400 ml-auto flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-glow"></span>
                    {isChatLoading ? "Печатает..." : "Онлайн"}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl leading-relaxed ${msg.role === "user" ? "bg-gradient-to-r from-[hsl(262_83%_65%)] to-[hsl(180_100%_50%)] text-white rounded-br-sm" : "bg-[hsl(225_15%_16%)] text-white rounded-bl-sm"}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-[hsl(225_15%_16%)] px-4 py-2.5 rounded-xl rounded-bl-sm">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-[hsl(225_15%_15%)] flex gap-2 flex-shrink-0">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isChatLoading && handleChat()}
                    placeholder="Задай любой вопрос Gemini..."
                    className="flex-1 text-xs bg-[hsl(225_15%_14%)] border border-[hsl(225_15%_18%)] rounded-xl px-3 py-2 text-white placeholder:text-muted-foreground focus:outline-none focus:border-[hsl(262_83%_65%/0.5)]"
                  />
                  <button
                    onClick={handleChat}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
                    style={{ background: "linear-gradient(135deg, hsl(262 83% 65%), hsl(180 100% 50%))" }}
                  >
                    <Icon name="Send" size={12} />
                  </button>
                </div>
              </div>
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
                <span className={`text-[9px] font-medium leading-none ${activeSection === item.id ? "text-[hsl(262_83%_75%)]" : "text-muted-foreground"}`}>
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