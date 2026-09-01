import * as React from "react";
import { cn } from "@/lib/utils";

export type AddyAction =
  "idle" | "walk" | "jump" | "hang" | "fall" | "climb" | "dance" | "cheer" | "sleep" | "wake";

export type AddyMoodType = "energetic" | "focused" | "relaxed" | "sleepy" | "celebrating";

interface AddyCharacterProps {
  action?: AddyAction;
  mood?: AddyMoodType;
  facing?: "left" | "right";
  isTalking?: boolean;
  className?: string;
}

export function AddyCharacter({
  action = "idle",
  mood = "energetic",
  facing = "right",
  isTalking = false,
  className,
}: AddyCharacterProps) {
  const [blink, setBlink] = React.useState(false);

  // Natural eye blinking loop
  React.useEffect(() => {
    const blinkInterval = setInterval(
      () => {
        setBlink(true);
        setTimeout(() => setBlink(false), 180);
      },
      3800 + Math.random() * 2000,
    );
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div
      className={cn(
        "relative select-none pointer-events-none transition-transform duration-300",
        facing === "left" ? "scale-x-[-1]" : "scale-x-100",
        className,
      )}
      style={{ width: "120px", height: "150px" }}
    >
      <svg
        viewBox="0 0 160 200"
        className="w-full h-full overflow-visible drop-shadow-[0_10px_14px_rgba(0,0,0,0.22)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients for rich 3D shading */}
          <linearGradient id="foxFur" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="60%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>

          <linearGradient id="foxCream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="100%" stopColor="#FED7AA" />
          </linearGradient>

          <linearGradient id="hairIndigo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="30%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id="hoodieTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="50%" stopColor="#0D9488" />
            <stop offset="100%" stopColor="#115E59" />
          </linearGradient>

          <linearGradient id="joggersTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#134E4A" />
          </linearGradient>

          <linearGradient id="sneakerRed" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="70%" stopColor="#DC2626" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="eyeBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Fluffy Fox Tail (Swishing Layer Behind) */}
        <g
          className={cn(
            "origin-[50px_130px] transition-transform duration-300",
            action === "walk" && "animate-tail-walk",
            action === "jump" && "animate-tail-jump",
            action === "hang" && "animate-tail-hang",
            action === "dance" && "animate-tail-dance",
            action === "fall" && "animate-tail-fall",
            action === "sleep" && "animate-tail-idle scale-95",
            action === "wake" && "animate-tail-jump",
            action === "idle" && "animate-tail-idle",
          )}
        >
          {/* Tail base orange */}
          <path
            d="M52 125 C30 115 5 130 10 155 C15 175 40 185 65 160 C68 150 62 135 52 125 Z"
            fill="url(#foxFur)"
            stroke="#9A3412"
            strokeWidth="2"
          />
          {/* Tail white fluffy tip */}
          <path
            d="M10 155 C7 142 16 134 25 132 C28 140 22 152 26 162 C18 168 12 162 10 155 Z"
            fill="url(#foxCream)"
            stroke="#D97706"
            strokeWidth="1.5"
          />
        </g>

        {/* 2. Left Leg & Left Sneaker (Behind Layer) */}
        <g
          className={cn(
            "origin-[66px_140px] transition-transform duration-200",
            action === "walk" && "animate-leg-left-walk",
            action === "jump" && "animate-leg-jump",
            action === "hang" && "animate-leg-left-hang",
            action === "dance" && "animate-leg-left-dance",
            action === "fall" && "animate-leg-left-fall",
            action === "climb" && "animate-leg-left-climb",
            action === "sleep" && "animate-leg-sleep-left",
          )}
        >
          {/* Left Jogger Thigh/Calf */}
          <path
            d="M60 135 L56 168 C56 172 68 172 70 168 L74 135 Z"
            fill="url(#joggersTeal)"
            stroke="#042F2E"
            strokeWidth="1.8"
          />
          {/* Jogger Cuffs */}
          <rect x="54" y="165" width="16" height="4" rx="2" fill="#14B8A6" />

          {/* Left Red Sneaker */}
          <g transform="translate(48, 168)">
            {/* Sneaker main */}
            <path
              d="M6 3 C6 1 12 0 16 2 L22 6 C25 8 26 12 24 16 L4 16 C1 16 0 14 1 11 L6 3 Z"
              fill="url(#sneakerRed)"
              stroke="#7F1D1D"
              strokeWidth="1.5"
            />
            {/* White Rubber Sole */}
            <rect
              x="0"
              y="14"
              width="26"
              height="5"
              rx="2.5"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <line x1="2" y1="16.5" x2="24" y2="16.5" stroke="#EF4444" strokeWidth="1" />
            {/* White Toe Cap & Laces */}
            <path d="M18 6 L23 10 L22 14 L16 14 Z" fill="#FFFFFF" />
            <line
              x1="10"
              y1="5"
              x2="15"
              y2="7"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="8"
              y1="8"
              x2="13"
              y2="10"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* 3. Left Arm (Behind Layer) */}
        <g
          className={cn(
            "origin-[58px_100px] transition-transform duration-200",
            action === "walk" && "animate-arm-left-walk",
            action === "jump" && "animate-arm-jump-up",
            action === "hang" && "animate-arm-hang-up",
            action === "dance" && "animate-arm-left-dance",
            action === "fall" && "animate-arm-left-fall",
            action === "cheer" && "animate-arm-cheer",
            action === "climb" && "animate-arm-left-climb",
            action === "sleep" && "animate-arm-sleep-left",
            action === "wake" && "animate-arm-wake-stretch",
          )}
        >
          {/* Left Sleeve */}
          <path
            d="M58 98 L44 120 C42 123 48 127 52 124 L64 105 Z"
            fill="url(#hoodieTeal)"
            stroke="#042F2E"
            strokeWidth="1.8"
          />
          {/* Left Fur Paw */}
          <circle cx="43" cy="126" r="6" fill="url(#foxFur)" stroke="#9A3412" strokeWidth="1.2" />
          <circle cx="40" cy="124" r="2" fill="url(#foxCream)" />
        </g>

        {/* 4. Torso with Admissions Cyan Hoodie */}
        <g
          className={cn(
            "origin-[80px_120px] transition-transform duration-200",
            action === "walk" && "animate-torso-walk",
            action === "jump" && "animate-torso-jump",
            action === "dance" && "animate-torso-dance",
            action === "sleep" && "animate-addy-sleep",
            action === "idle" && "animate-torso-idle",
          )}
        >
          {/* Hoodie Body */}
          <path
            d="M56 94 C54 110 56 136 60 142 C65 145 95 145 100 142 C104 136 106 110 104 94 C100 90 60 90 56 94 Z"
            fill="url(#hoodieTeal)"
            stroke="#042F2E"
            strokeWidth="2"
          />

          {/* Hoodie Ribbed Waistband */}
          <rect
            x="58"
            y="136"
            width="44"
            height="6"
            rx="3"
            fill="#0D9488"
            stroke="#042F2E"
            strokeWidth="1.2"
          />

          {/* Front Kangaroo Pouch Pocket */}
          <path
            d="M64 118 L96 118 L93 134 L67 134 Z"
            fill="#0F766E"
            stroke="#042F2E"
            strokeWidth="1.2"
          />

          {/* Yellow Smiley Face Badge on Chest */}
          <g transform="translate(68, 102)">
            <circle cx="7" cy="7" r="6" fill="#FACC15" stroke="#CA8A04" strokeWidth="1" />
            <circle cx="5" cy="5.5" r="0.8" fill="#713F12" />
            <circle cx="9" cy="5.5" r="0.8" fill="#713F12" />
            <path
              d="M4.5 8.5 C5.5 10.5 8.5 10.5 9.5 8.5"
              stroke="#713F12"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* "SACE" text on chest */}
          <text
            x="83"
            y="112"
            fill="#FFFFFF"
            fontSize="5"
            fontWeight="bold"
            letterSpacing="0.2"
            textAnchor="start"
            fontFamily="sans-serif"
          >
            SACE
          </text>

          {/* White Hoodie Drawstrings */}
          <path
            d="M74 94 Q73 104 71 112"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="71" cy="113" r="1.2" fill="#E2E8F0" />
          <path
            d="M86 94 Q87 104 89 112"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="89" cy="113" r="1.2" fill="#E2E8F0" />
        </g>

        {/* 5. Right Leg & Right Sneaker (Foreground Layer) */}
        <g
          className={cn(
            "origin-[90px_140px] transition-transform duration-200",
            action === "walk" && "animate-leg-right-walk",
            action === "jump" && "animate-leg-jump",
            action === "hang" && "animate-leg-right-hang",
            action === "dance" && "animate-leg-right-dance",
            action === "fall" && "animate-leg-right-fall",
            action === "climb" && "animate-leg-right-climb",
            action === "sleep" && "animate-leg-sleep-right",
          )}
        >
          {/* Right Jogger */}
          <path
            d="M84 135 L82 168 C82 172 94 172 96 168 L100 135 Z"
            fill="url(#joggersTeal)"
            stroke="#042F2E"
            strokeWidth="1.8"
          />
          {/* Jogger Cuffs */}
          <rect x="80" y="165" width="16" height="4" rx="2" fill="#14B8A6" />

          {/* Right Red Sneaker */}
          <g transform="translate(76, 168)">
            {/* Sneaker main */}
            <path
              d="M6 3 C6 1 12 0 16 2 L23 6 C26 8 27 12 25 16 L4 16 C1 16 0 14 1 11 L6 3 Z"
              fill="url(#sneakerRed)"
              stroke="#7F1D1D"
              strokeWidth="1.5"
            />
            {/* White Rubber Sole */}
            <rect
              x="0"
              y="14"
              width="28"
              height="5"
              rx="2.5"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1"
            />
            <line x1="2" y1="16.5" x2="26" y2="16.5" stroke="#EF4444" strokeWidth="1" />
            {/* White Toe Cap & Laces */}
            <path d="M19 6 L25 10 L24 14 L17 14 Z" fill="#FFFFFF" />
            <line
              x1="11"
              y1="5"
              x2="16"
              y2="7"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="9"
              y1="8"
              x2="14"
              y2="10"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* 6. Head & Facial Expressions */}
        <g
          className={cn(
            "origin-[80px_90px] transition-transform duration-200",
            action === "walk" && "animate-head-walk",
            action === "jump" && "animate-head-jump",
            action === "dance" && "animate-head-dance",
            action === "hang" && "animate-head-hang",
            action === "fall" && "animate-head-fall",
            action === "sleep" && "animate-head-sleep",
            action === "wake" && "animate-head-wake",
            action === "idle" && "animate-head-idle",
          )}
        >
          {/* Large Fennec Fox Ears */}
          {/* Left Ear */}
          <g className={cn("origin-[50px_45px]", action === "sleep" && "rotate-6 translate-y-1")}>
            <path
              d="M52 50 C40 25 28 8 22 5 C22 18 32 45 42 58 Z"
              fill="url(#foxFur)"
              stroke="#9A3412"
              strokeWidth="2"
            />
            {/* Inner Ear Fluff Cream */}
            <path d="M48 48 C40 30 32 18 28 14 C28 24 36 44 42 52 Z" fill="url(#foxCream)" />
            {/* Ear Fluff Tufts */}
            <path
              d="M38 42 Q32 40 35 48 Q30 46 34 54"
              stroke="#FFFBEB"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Right Ear */}
          <g className={cn("origin-[110px_45px]", action === "sleep" && "-rotate-6 translate-y-1")}>
            <path
              d="M108 50 C120 25 132 8 138 5 C138 18 128 45 118 58 Z"
              fill="url(#foxFur)"
              stroke="#9A3412"
              strokeWidth="2"
            />
            {/* Inner Ear Fluff Cream */}
            <path d="M112 48 C120 30 128 18 132 14 C132 24 124 44 118 52 Z" fill="url(#foxCream)" />
            {/* Ear Fluff Tufts */}
            <path
              d="M122 42 Q128 40 125 48 Q130 46 126 54"
              stroke="#FFFBEB"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Head Base Round Shape */}
          <circle cx="80" cy="62" r="28" fill="url(#foxFur)" stroke="#9A3412" strokeWidth="2" />

          {/* Cream Cheeks / Muzzle Mask */}
          <path
            d="M54 62 C54 78 68 88 80 88 C92 88 106 78 106 62 C106 58 98 64 80 64 C62 64 54 58 54 62 Z"
            fill="url(#foxCream)"
          />

          {/* Side Cheek Fluff Puffs */}
          <path
            d="M52 64 L44 68 L53 72 L45 76 L56 78"
            fill="url(#foxFur)"
            stroke="#9A3412"
            strokeWidth="1.2"
          />
          <path
            d="M108 64 L116 68 L107 72 L115 76 L104 78"
            fill="url(#foxFur)"
            stroke="#9A3412"
            strokeWidth="1.2"
          />

          {/* Spiky Anime Indigo/Dark Blue Hair on Top */}
          <g>
            <path
              d="M55 46 C60 26 72 20 80 18 C88 20 100 26 105 46 C98 38 88 34 80 34 C72 34 62 38 55 46 Z"
              fill="url(#hairIndigo)"
            />
            {/* Front Spikes */}
            <path
              d="M70 30 L76 12 L84 28 L94 16 L96 34 L88 38 L80 36 L70 38 Z"
              fill="url(#hairIndigo)"
              stroke="#0F172A"
              strokeWidth="1.5"
            />
            <path d="M60 38 L62 24 L72 34" fill="url(#hairIndigo)" />
            <path d="M100 38 L98 24 L88 34" fill="url(#hairIndigo)" />
          </g>

          {/* Sleep Nightcap when sleeping */}
          {action === "sleep" && (
            <g className="origin-[80px_35px]">
              {/* Cozy Nightcap cone curving down */}
              <path
                d="M58 38 C56 18 80 12 102 16 C118 20 128 32 134 46 C130 48 126 44 120 38 C104 22 84 28 62 42 Z"
                fill="#4338CA"
                stroke="#312E81"
                strokeWidth="1.5"
              />
              {/* Nightcap Band */}
              <path
                d="M56 40 C70 32 90 32 104 40 L102 45 C88 38 72 38 58 45 Z"
                fill="#FBBF24"
                stroke="#D97706"
                strokeWidth="1"
              />
              {/* Soft White Pom-pom ball on tip */}
              <circle cx="135" cy="48" r="6" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
              {/* Golden Crescent Moon on Nightcap */}
              <path d="M80 20 A 4 4 0 0 0 84 26 A 5 5 0 1 1 80 20 Z" fill="#FDE047" />
            </g>
          )}

          {/* Expressive Eyes */}
          {action === "sleep" ? (
            /* Peaceful Sleeping Curved Arc Eyelids ⌒ ⌒ */
            <g>
              <path
                d="M62 60 Q68 65 74 60"
                stroke="#1E293B"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M86 60 Q92 65 98 60"
                stroke="#1E293B"
                strokeWidth="2.8"
                strokeLinecap="round"
                fill="none"
              />
              {/* Gentle sleepy eyelashes */}
              <line
                x1="68"
                y1="63"
                x2="68"
                y2="66"
                stroke="#1E293B"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="92"
                y1="63"
                x2="92"
                y2="66"
                stroke="#1E293B"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          ) : action === "wake" ? (
            /* Waking up sparkling eyes */
            <g>
              <ellipse
                cx="68"
                cy="58"
                rx="6.5"
                ry="8"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <ellipse cx="69" cy="58" rx="5" ry="6.5" fill="url(#eyeBlue)" />
              <circle cx="70" cy="58" r="3" fill="#0F172A" />
              {/* Big star shine */}
              <polygon
                points="68,52 70,55 73,55 70,57 71,60 68,58 65,60 66,57 63,55 66,55"
                fill="#FDE047"
              />

              <ellipse
                cx="92"
                cy="58"
                rx="6.5"
                ry="8"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <ellipse cx="91" cy="58" rx="5" ry="6.5" fill="url(#eyeBlue)" />
              <circle cx="90" cy="58" r="3" fill="#0F172A" />
              <polygon
                points="92,52 94,55 97,55 94,57 95,60 92,58 89,60 90,57 87,55 90,55"
                fill="#FDE047"
              />
            </g>
          ) : action === "fall" ? (
            /* Dizzy Spiral / Closed Stars Eyes during Fall */
            <g>
              {/* Left Eye Dizzy */}
              <path
                d="M64 56 L72 64 M72 56 L64 64"
                stroke="#1E293B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Right Eye Dizzy */}
              <path
                d="M88 56 L96 64 M96 56 L88 64"
                stroke="#1E293B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          ) : action === "cheer" || action === "dance" ? (
            /* Happy Closed Arc Eyes during Cheer/Dance */
            <g>
              <path
                d="M63 62 Q68 54 73 62"
                stroke="#0F172A"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M87 62 Q92 54 97 62"
                stroke="#0F172A"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : blink ? (
            /* Blinking closed line */
            <g>
              <line
                x1="63"
                y1="60"
                x2="73"
                y2="60"
                stroke="#0F172A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="87"
                y1="60"
                x2="97"
                y2="60"
                stroke="#0F172A"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          ) : (
            /* Big Bright Expressive Anime Eyes */
            <g>
              {/* Left Eye White & Iris */}
              <ellipse
                cx="68"
                cy="58"
                rx="6.5"
                ry="8"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <ellipse cx="69" cy="58" rx="5" ry="6.5" fill="url(#eyeBlue)" />
              <circle cx="70" cy="58" r="3.2" fill="#0F172A" />
              {/* Eye Catchlights Sparkle */}
              <circle cx="67.5" cy="55.5" r="2" fill="#FFFFFF" />
              <circle cx="71.5" cy="61.5" r="1" fill="#FFFFFF" />

              {/* Right Eye White & Iris */}
              <ellipse
                cx="92"
                cy="58"
                rx="6.5"
                ry="8"
                fill="#FFFFFF"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <ellipse cx="91" cy="58" rx="5" ry="6.5" fill="url(#eyeBlue)" />
              <circle cx="90" cy="58" r="3.2" fill="#0F172A" />
              {/* Eye Catchlights Sparkle */}
              <circle cx="89.5" cy="55.5" r="2" fill="#FFFFFF" />
              <circle cx="93.5" cy="61.5" r="1" fill="#FFFFFF" />

              {/* Eyebrows */}
              <path
                d="M63 49 Q68 46 74 49"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M86 49 Q92 46 97 49"
                stroke="#0F172A"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}

          {/* Cute Pink Cheeks Blush */}
          <ellipse
            cx="59"
            cy="68"
            rx="4"
            ry="2.2"
            fill="#F43F5E"
            opacity={action === "sleep" ? "0.65" : "0.45"}
          />
          <ellipse
            cx="101"
            cy="68"
            rx="4"
            ry="2.2"
            fill="#F43F5E"
            opacity={action === "sleep" ? "0.65" : "0.45"}
          />

          {/* Little Fox Nose */}
          <path d="M77 69 L83 69 L80 73 Z" fill="#0F172A" />

          {/* Animated Mouth */}
          {action === "sleep" ? (
            /* Calm gentle sleeping smile */
            <path
              d="M77 75 Q80 77 83 75"
              stroke="#0F172A"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          ) : action === "wake" ? (
            /* Big cute yawn */
            <g>
              <ellipse
                cx="80"
                cy="78"
                rx="4.5"
                ry="6"
                fill="#991B1B"
                stroke="#0F172A"
                strokeWidth="1.5"
              />
              <ellipse cx="80" cy="80" rx="3.5" ry="3" fill="#F43F5E" />
            </g>
          ) : isTalking ? (
            /* Open Talking Mouth */
            <g className="animate-pulse">
              <path d="M74 74 Q80 84 86 74 Z" fill="#991B1B" stroke="#0F172A" strokeWidth="1.5" />
              <path d="M77 78 Q80 82 83 78" fill="#F43F5E" />
            </g>
          ) : action === "fall" ? (
            /* Surprised O mouth during fall */
            <ellipse
              cx="80"
              cy="77"
              rx="3.5"
              ry="5"
              fill="#991B1B"
              stroke="#0F172A"
              strokeWidth="1.5"
            />
          ) : (
            /* Cheerful Happy Smile */
            <path
              d="M74 73 Q77 77 80 74 Q83 77 86 73"
              stroke="#0F172A"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
          )}
        </g>

        {/* 7. Right Arm & Hand (Foreground Layer - Swings and waves!) */}
        <g
          className={cn(
            "origin-[102px_100px] transition-transform duration-200",
            action === "walk" && "animate-arm-right-walk",
            action === "jump" && "animate-arm-jump-up",
            action === "hang" && "animate-arm-hang-up",
            action === "dance" && "animate-arm-right-dance",
            action === "fall" && "animate-arm-right-fall",
            action === "cheer" && "animate-arm-cheer",
            action === "climb" && "animate-arm-right-climb",
            action === "sleep" && "animate-arm-sleep-right",
            action === "wake" && "animate-arm-wake-stretch",
          )}
        >
          {/* Right Sleeve */}
          <path
            d="M102 98 L116 120 C118 123 112 127 108 124 L96 105 Z"
            fill="url(#hoodieTeal)"
            stroke="#042F2E"
            strokeWidth="1.8"
          />
          {/* Right Fur Paw with Thumbs-up Gesture */}
          <g transform="translate(112, 122)">
            <circle cx="5" cy="5" r="6" fill="url(#foxFur)" stroke="#9A3412" strokeWidth="1.2" />
            {/* Thumb */}
            <path d="M4 1 C6 -2 9 -1 8 3 Z" fill="url(#foxFur)" stroke="#9A3412" strokeWidth="1" />
            <circle cx="6" cy="5" r="2.5" fill="url(#foxCream)" />
          </g>
        </g>

        {/* 8. Floating Zzz Symbols when Sleeping */}
        {action === "sleep" && (
          <g className="pointer-events-none select-none">
            {/* Big Z */}
            <g className="animate-zzz-1" transform="translate(100, 30)">
              <text
                x="0"
                y="0"
                fill="#818CF8"
                stroke="#312E81"
                strokeWidth="0.8"
                fontSize="18"
                fontWeight="900"
                fontFamily="sans-serif"
                filter="url(#softGlow)"
              >
                Z
              </text>
            </g>
            {/* Medium z */}
            <g className="animate-zzz-2" transform="translate(110, 42)">
              <text
                x="0"
                y="0"
                fill="#60A5FA"
                stroke="#1E3A8A"
                strokeWidth="0.6"
                fontSize="14"
                fontWeight="800"
                fontFamily="sans-serif"
                filter="url(#softGlow)"
              >
                z
              </text>
            </g>
            {/* Small z */}
            <g className="animate-zzz-3" transform="translate(94, 52)">
              <text
                x="0"
                y="0"
                fill="#38BDF8"
                stroke="#0369A1"
                strokeWidth="0.5"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                z
              </text>
            </g>
          </g>
        )}

        {/* 9. Mood Specific Aura & Visual Sparks */}
        {action !== "sleep" && mood === "celebrating" && (
          <g className="pointer-events-none select-none">
            {/* Celebration Stars & Confetti */}
            <circle cx="35" cy="40" r="3" fill="#EC4899" className="animate-ping" />
            <circle cx="125" cy="35" r="2.5" fill="#F59E0B" className="animate-ping" />
            <polygon
              points="130,55 133,60 138,60 134,63 136,68 130,65 125,68 127,63 122,60 128,60"
              fill="#FDE047"
              className="animate-pulse"
            />
            <polygon
              points="30,65 32,70 37,70 33,73 35,78 30,75 25,78 27,73 22,70 28,70"
              fill="#A855F7"
              className="animate-pulse"
            />
          </g>
        )}

        {action !== "sleep" && mood === "focused" && (
          <g className="pointer-events-none select-none">
            {/* Cyber focus sparks around ears */}
            <path
              d="M30 45 L36 48 L32 52"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="animate-pulse"
            />
            <path
              d="M130 45 L124 48 L128 52"
              stroke="#0ea5e9"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="animate-pulse"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
