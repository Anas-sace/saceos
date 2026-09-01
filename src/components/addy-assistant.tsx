import * as React from "react";
import {
  Sparkles,
  Bot,
  Send,
  X,
  Footprints,
  ArrowUpCircle,
  Activity,
  Smile,
  EyeOff,
  Anchor,
  RotateCcw,
  Moon,
  Sun,
  Flame,
  Zap,
  Coffee,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useServerFn } from "@tanstack/react-start";
import { askAddy } from "@/lib/addy.functions";
import { useApp, dateKey } from "@/lib/store";
import { roleLabel } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AddyCharacter, AddyAction } from "@/components/addy-character";
import addyAvatarSrc from "@/assets/images/addy_character_1788268940252.jpg";

export type ActionType = AddyAction;

export type AddyMood = "energetic" | "focused" | "relaxed" | "sleepy" | "celebrating";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do I log a weekly task?",
  "What goes in my EOD report?",
  "How do I apply for leave?",
  "Guide me on attendance proofs!",
];

const QUICK_ACTIONS: {
  type: ActionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: "walk", label: "Walk around", icon: Footprints },
  { type: "jump", label: "Jump & Land", icon: ArrowUpCircle },
  { type: "hang", label: "Hang from top", icon: Anchor },
  { type: "fall", label: "Slip & Fall", icon: RotateCcw },
  { type: "climb", label: "Climb up", icon: Activity },
  { type: "dance", label: "Dance party", icon: Sparkles },
  { type: "cheer", label: "Cheer squad", icon: Smile },
  { type: "sleep", label: "Go to Sleep", icon: Moon },
  { type: "wake", label: "Wake Up", icon: Sun },
];

export function AddyAssistant() {
  const { me, state } = useApp();
  const ask = useServerFn(askAddy);

  const [minimized, setMinimized] = React.useState<boolean>(false);
  const [showStuntsBar, setShowStuntsBar] = React.useState<boolean>(true);

  // Sleep & Wake State
  const [isSleeping, setIsSleeping] = React.useState<boolean>(false);

  // Manual Mood Override (null = automatic based on productivity & time)
  const [manualMood, setManualMood] = React.useState<AddyMood | null>(null);

  // Assistant Chat drawer state
  const [chatOpen, setChatOpen] = React.useState(false);
  const [chatInput, setChatInput] = React.useState("");
  const [chatBusy, setChatBusy] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm **Addy**, your 3D mascot companion & SACE Portal guide! My mood and animations now dynamically adapt based on your active tasks, clock-in status, and work hours. Click me to chat or trigger a stunt!",
    },
  ]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatOpen) {
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chatOpen]);

  // Compute User Productivity State & Auto Mood
  const computedMoodInfo = React.useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const today = dateKey(now);

    // Productivity metrics
    const userTasks = state.tasks.filter((t) => !me || t.assigneeId === me.id);
    const completedTasksToday = userTasks.filter(
      (t) => t.status === "completed" || t.status === "approved",
    ).length;
    const inProgressTasks = userTasks.filter(
      (t) => t.status === "in_progress" || t.status === "submitted",
    ).length;

    const userAttendanceToday = state.attendance.find(
      (a) => (!me || a.userId === me.id) && a.date === today,
    );
    const isPunchedIn = Boolean(userAttendanceToday?.punchIn && !userAttendanceToday?.punchOut);

    let mood: AddyMood = "energetic";
    let label = "Active & Ready";
    let reason = "Work day is in full swing!";

    // 1. Time-of-day rules
    if (currentHour >= 22 || currentHour < 6) {
      mood = "sleepy";
      label = "Late Night Rest";
      reason = "Past late hours — winding down";
    } else if (currentHour >= 19 && currentHour < 22) {
      mood = "relaxed";
      label = "Evening Cooldown";
      reason = "Wrapping up the day's sprint";
    }

    // 2. Productivity overlays
    if (completedTasksToday >= 3 && currentHour < 22) {
      mood = "celebrating";
      label = "High Achiever 🎉";
      reason = `${completedTasksToday} tasks finished today!`;
    } else if (isPunchedIn && inProgressTasks > 0 && currentHour >= 8 && currentHour < 20) {
      mood = "focused";
      label = "Deep Focus ⚡";
      reason = `Punched in • ${inProgressTasks} task(s) active`;
    } else if (currentHour >= 7 && currentHour < 12) {
      mood = "energetic";
      label = "Morning Hustle ☀️";
      reason = "Fresh start to the work day";
    }

    return {
      mood: manualMood || mood,
      autoMood: mood,
      label: manualMood ? `Custom: ${manualMood}` : label,
      reason,
      completedCount: completedTasksToday,
      inProgressCount: inProgressTasks,
      isPunchedIn,
      currentHour,
    };
  }, [state.tasks, state.attendance, me, manualMood]);

  const activeMood = computedMoodInfo.mood;

  // Addy Physics & Interactive Position State
  const [xPos, setXPos] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      return Math.max(30, window.innerWidth - 170);
    }
    return 750;
  });

  const [yPos, setYPos] = React.useState<number>(() => {
    if (typeof window !== "undefined") {
      return Math.max(60, window.innerHeight - 175);
    }
    return 550;
  });

  const [facing, setFacing] = React.useState<"left" | "right">("left");
  const [action, setAction] = React.useState<ActionType>("idle");
  const [bubbleText, setBubbleText] = React.useState<string | null>(
    "Hi there! I'm Addy — mood synced with your workday!",
  );
  const [isWandering, setIsWandering] = React.useState<boolean>(true);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [actionLocked, setActionLocked] = React.useState<boolean>(false);

  // Position and drag refs
  const dragStartRef = React.useRef<{
    mouseX: number;
    mouseY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const addyRef = React.useRef<HTMLDivElement>(null);

  // Clear speech bubble after delay
  React.useEffect(() => {
    if (!bubbleText) return;
    const timer = setTimeout(() => {
      setBubbleText(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [bubbleText]);

  // Keep Addy inside screen bounds on resize
  React.useEffect(() => {
    const handleResize = () => {
      setXPos((prev) => Math.max(20, Math.min(window.innerWidth - 140, prev)));
      setYPos((prev) => Math.max(50, Math.min(window.innerHeight - 170, prev)));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getGroundY = () => {
    if (typeof window !== "undefined") {
      return Math.max(60, window.innerHeight - 170);
    }
    return 550;
  };

  // Put Addy to sleep
  const goToSleep = () => {
    setIsSleeping(true);
    setAction("sleep");
    setActionLocked(true);
    setBubbleText("Zzz... sleeping peacefully! 🌙 Tap me or click Wake Up anytime.");
  };

  // Wake Addy up
  const wakeUp = () => {
    setIsSleeping(false);
    setAction("wake");
    setBubbleText("*Yaaawn!* ☀️ Good morning! I'm awake and ready for SACE tasks!");
    setTimeout(() => {
      setAction("idle");
      setActionLocked(false);
    }, 1600);
  };

  // Auto sleep if time-of-day mood changes to sleepy
  React.useEffect(() => {
    if (activeMood === "sleepy" && !isSleeping && !actionLocked && !manualMood) {
      goToSleep();
    }
  }, [activeMood]);

  // Autonomous wandering & dynamic physics action loop tailored to Current Mood
  React.useEffect(() => {
    if (!isWandering || isDragging || actionLocked || chatOpen || isSleeping) return;

    // Mood-specific interval timing (energetic wanders faster, focused stays still longer)
    const tickDelay =
      activeMood === "energetic"
        ? 5000
        : activeMood === "celebrating"
          ? 4500
          : activeMood === "focused"
            ? 8500
            : 7000;

    const interval = setInterval(() => {
      const rand = Math.random();

      // CELEBRATING MOOD BEHAVIOR (Dances & Cheers)
      if (activeMood === "celebrating") {
        if (rand < 0.4) {
          setAction("dance");
          setBubbleText("Amazing productivity today! Keep shining! ✨");
          setTimeout(() => {
            if (!actionLocked && !isSleeping) setAction("idle");
          }, 2400);
        } else if (rand < 0.7) {
          setAction("cheer");
          setBubbleText("Milestone crushed! You rock!");
          setTimeout(() => {
            if (!actionLocked && !isSleeping) setAction("idle");
          }, 2000);
        } else {
          // Playful jump
          setAction("jump");
          const jumpApex = Math.max(60, yPos - 110);
          const landingY = getGroundY();
          setYPos(jumpApex);
          setTimeout(() => setYPos(landingY), 650);
          setTimeout(() => {
            if (!actionLocked && !isSleeping) setAction("idle");
          }, 1200);
        }
        return;
      }

      // FOCUSED MOOD BEHAVIOR (Gentle pacing, encouraging deep work)
      if (activeMood === "focused") {
        if (rand < 0.35) {
          // Quiet pacing
          const targetX = Math.max(
            40,
            Math.min(window.innerWidth - 150, xPos + (Math.random() * 180 - 90)),
          );
          setFacing(targetX > xPos ? "right" : "left");
          setAction("walk");
          setXPos(targetX);
          setTimeout(() => {
            if (!actionLocked && !isSleeping) setAction("idle");
          }, 1500);
        } else if (rand < 0.6) {
          const focusTips = [
            "In the flow state! Keep up the momentum ⚡",
            "Punched in and executing cleanly!",
            "Need anything clarified? Click to ask!",
            "Great pace on today's sprint backlog.",
          ];
          setBubbleText(focusTips[Math.floor(Math.random() * focusTips.length)]);
        }
        return;
      }

      // ENERGETIC / DEFAULT BEHAVIOR
      if (rand < 0.38) {
        // Walk from here to there across the screen
        const targetX = Math.max(
          40,
          Math.min(window.innerWidth - 150, xPos + (Math.random() * 320 - 160)),
        );
        const groundY = getGroundY();
        const targetY = Math.max(groundY - 30, Math.min(groundY, yPos + (Math.random() * 60 - 30)));

        setFacing(targetX > xPos ? "right" : "left");
        setAction("walk");
        setXPos(targetX);
        setYPos(targetY);

        setTimeout(() => {
          if (!actionLocked && !isSleeping) setAction("idle");
        }, 1900);
      } else if (rand < 0.56) {
        // High jump and smooth come down
        setAction("jump");
        const jumpApex = Math.max(60, yPos - 110);
        const landingY = getGroundY();

        setYPos(jumpApex);
        setBubbleText("Leaping over the cards!");

        setTimeout(() => {
          setYPos(landingY);
        }, 650);

        setTimeout(() => {
          if (!actionLocked && !isSleeping) setAction("idle");
        }, 1300);
      } else if (rand < 0.7) {
        // Jump up and hang from the top ceiling / navbar
        setAction("hang");
        setYPos(16);
        setBubbleText("Hanging out from the top bar!");

        // After hanging a few seconds, drop down gracefully
        setTimeout(() => {
          if (!actionLocked && !isSleeping) {
            setAction("fall");
            setYPos(getGroundY());
            setBubbleText("Wheee! Dropping down safely!");
            setTimeout(() => {
              if (!actionLocked && !isSleeping) setAction("idle");
            }, 1100);
          }
        }, 3200);
      } else if (rand < 0.85) {
        // Friendly portal tips
        const randomTips = [
          "Don't forget to submit your proof today!",
          "Great day to hit your cadence targets!",
          "Need help with leave or tasks? Click me to chat!",
          "You're doing awesome on SACE Portal!",
          "Checking the latest roster...",
        ];
        setBubbleText(randomTips[Math.floor(Math.random() * randomTips.length)]);
      }
    }, tickDelay);

    return () => clearInterval(interval);
  }, [isWandering, isDragging, actionLocked, chatOpen, isSleeping, xPos, yPos, activeMood]);

  // Execute explicit action triggered by user
  const triggerAction = (newAction: ActionType, speak?: string) => {
    if (newAction === "sleep") {
      goToSleep();
      return;
    }
    if (newAction === "wake") {
      wakeUp();
      return;
    }

    if (isSleeping) {
      setIsSleeping(false);
    }

    setActionLocked(true);
    setAction(newAction);
    if (speak) setBubbleText(speak);

    const groundY = getGroundY();

    if (newAction === "jump") {
      setYPos((prev) => Math.max(50, prev - 130));
      setTimeout(() => {
        setYPos(groundY);
      }, 700);
      setTimeout(() => {
        setAction("idle");
        setActionLocked(false);
      }, 1400);
    } else if (newAction === "hang") {
      setYPos(16);
      setBubbleText("Hanging from the top edge!");
      setTimeout(() => {
        setAction("idle");
        setActionLocked(false);
      }, 4000);
    } else if (newAction === "fall") {
      setBubbleText("Whoa! Slipping and falling down!");
      setYPos(groundY);
      setTimeout(() => {
        setBubbleText("Landed safely! All good!");
        setAction("idle");
        setActionLocked(false);
      }, 1200);
    } else if (newAction === "climb") {
      setBubbleText("Climbing up the screen!");
      setYPos((prev) => Math.max(40, prev - 140));
      setTimeout(() => {
        setAction("idle");
        setActionLocked(false);
      }, 1800);
    } else if (newAction === "walk") {
      const step = facing === "left" ? -180 : 180;
      const targetX = Math.max(30, Math.min(window.innerWidth - 150, xPos + step));
      setXPos(targetX);
      setTimeout(() => {
        setAction("idle");
        setActionLocked(false);
      }, 1800);
    } else if (newAction === "dance") {
      setBubbleText("Dance party time! 🎵");
      setTimeout(() => {
        setAction("idle");
        setActionLocked(false);
      }, 2500);
    } else if (newAction === "cheer") {
      setBubbleText("You've got this! Keep rocking SACE!");
      setTimeout(() => {
        setAction("idle");
        setActionLocked(false);
      }, 2000);
    }
  };

  // Dragging handlers for free screen manipulation
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: xPos,
      startY: yPos,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.mouseX;
    const deltaY = e.clientY - dragStartRef.current.mouseY;

    const newX = Math.max(
      10,
      Math.min(window.innerWidth - 130, dragStartRef.current.startX + deltaX),
    );
    const newY = Math.max(
      10,
      Math.min(window.innerHeight - 150, dragStartRef.current.startY + deltaY),
    );

    if (newX > xPos) setFacing("right");
    else if (newX < xPos) setFacing("left");

    setXPos(newX);
    setYPos(newY);
    setAction("walk");
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    const groundY = getGroundY();

    // Physics check based on where the user dropped Addy:
    if (yPos <= 65) {
      // Released near ceiling -> Hang from top!
      setYPos(16);
      setAction("hang");
      setBubbleText("Holding onto the ceiling!");
      setTimeout(() => setAction("idle"), 3500);
    } else if (yPos < groundY - 80) {
      // Released high in mid-air -> Fall down with gravity physics!
      setAction("fall");
      setBubbleText("Falling down!");
      setTimeout(() => {
        setYPos(groundY);
      }, 100);
      setTimeout(() => {
        setBubbleText("Landed on my feet!");
        setAction("idle");
      }, 1100);
    } else {
      // Released near ground -> little celebratory bounce
      setAction("jump");
      setTimeout(() => setAction("idle"), 700);
    }
  };

  // Chat messaging
  const sendChat = async (text: string) => {
    const value = text.trim();
    if (!value || chatBusy) return;
    const next = [...messages, { role: "user" as const, content: value }];
    setMessages(next);
    setChatInput("");
    setChatBusy(true);
    setAction("dance");
    setBubbleText("Thinking...");

    try {
      const res = await ask({
        data: {
          messages: next.filter((m) => m.content).slice(-12),
          context: me ? `${me.fullName}, ${roleLabel(me.role)}, ${me.designation}` : undefined,
        },
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply || "I didn't catch that — try again?",
        },
      ]);
      setBubbleText("Here's what I found for you!");
      triggerAction("cheer");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I couldn't reach the assistant service just now. Please try again in a moment.",
        },
      ]);
      triggerAction("fall", "Oops, my connection slipped!");
    } finally {
      setChatBusy(false);
    }
  };

  const MoodIcon =
    activeMood === "celebrating"
      ? Sparkles
      : activeMood === "focused"
        ? Zap
        : activeMood === "sleepy"
          ? Moon
          : activeMood === "relaxed"
            ? Coffee
            : Flame;

  return (
    <>
      {/* Minimized Summon Button when Addy is in sleep mode */}
      {minimized && (
        <button
          onClick={() => {
            setMinimized(false);
            setBubbleText("I'm back! Let's explore together!");
          }}
          className="fixed bottom-5 right-5 z-[999] flex items-center gap-2 rounded-full border border-primary/40 bg-card/95 px-3 py-2 text-xs font-semibold text-foreground shadow-xl backdrop-blur transition-all duration-200 hover:scale-105 hover:border-primary hover:bg-primary/10 animate-in fade-in zoom-in"
          title="Summon Addy mascot"
        >
          <div className="relative h-6 w-6 overflow-hidden rounded-full border border-primary/40">
            <img src={addyAvatarSrc} alt="Addy" className="h-full w-full object-cover" />
          </div>
          <span>Summon Addy</span>
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 h-4 border-primary/30 bg-primary/10 text-primary capitalize"
          >
            {activeMood}
          </Badge>
        </button>
      )}

      {/* Floating 3D mascot Companion & Control Layer */}
      {!minimized && (
        <div
          ref={addyRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            transform: `translate3d(${xPos}px, ${yPos}px, 0px)`,
            transition:
              isDragging || action === "jump" || action === "fall"
                ? "none"
                : "transform 0.9s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
          className={cn(
            "fixed top-0 left-0 z-[999] select-none touch-none cursor-grab active:cursor-grabbing",
            isDragging && "scale-105",
          )}
        >
          <div className="relative group flex flex-col items-center">
            {/* 1. Floating Speech Bubble (positioned above top controls with clear z-index and pointer-events) */}
            {bubbleText && !chatOpen && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl border-2 border-primary/40 bg-card/95 px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200 flex items-center gap-2.5 z-50 pointer-events-auto",
                  yPos < 90 ? "top-[160px]" : "-top-24",
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                      isSleeping
                        ? "bg-indigo-400 animate-pulse"
                        : activeMood === "celebrating"
                          ? "bg-pink-500 animate-bounce"
                          : activeMood === "focused"
                            ? "bg-sky-500 animate-pulse"
                            : "bg-emerald-500 animate-pulse",
                    )}
                  />
                  <span className="max-w-[280px] sm:max-w-xs truncate">{bubbleText}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBubbleText(null);
                  }}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Dismiss message"
                  aria-label="Dismiss message"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 border-x-4 border-x-transparent",
                    yPos < 90
                      ? "-top-1.5 border-b-4 border-b-card/95"
                      : "-bottom-1.5 border-t-4 border-t-card/95",
                  )}
                />
              </div>
            )}

            {/* 2. Overhead Controls & Mood Badge directly atop Addy */}
            {isSleeping ? (
              /* When Sleeping: prominent glowing Wake Up button directly on top */
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border-2 border-amber-500 bg-card/95 px-4 py-1.5 shadow-[0_10px_25px_rgba(245,158,11,0.35)] backdrop-blur-md z-50 whitespace-nowrap animate-in fade-in zoom-in pointer-events-auto",
                  yPos < 60 ? "top-[155px]" : "-top-12",
                )}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    wakeUp();
                  }}
                  className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 hover:scale-105 transition-all cursor-pointer"
                  title="Click to wake Addy up!"
                >
                  <Sun
                    className="h-4 w-4 text-amber-500 animate-spin"
                    style={{ animationDuration: "6s" }}
                  />
                  <span>Wake Up Addy ☀️</span>
                </button>
              </div>
            ) : (
              /* When Awake: full suite of controls on top with distinct colorful icons & Mood badge */
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border-2 border-primary/30 bg-card/95 px-2.5 py-1 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-200 hover:border-primary hover:shadow-[0_8px_30px_rgba(14,165,233,0.3)] z-50 whitespace-nowrap pointer-events-auto",
                  yPos < 60 ? "top-[155px]" : "-top-12",
                )}
              >
                {/* Dynamic Mood Status Pill */}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                    activeMood === "celebrating"
                      ? "bg-pink-500/15 border-pink-500/40 text-pink-600"
                      : activeMood === "focused"
                        ? "bg-sky-500/15 border-sky-500/40 text-sky-600"
                        : activeMood === "relaxed"
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-600"
                          : activeMood === "sleepy"
                            ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-600"
                            : "bg-emerald-500/15 border-emerald-500/40 text-emerald-600",
                  )}
                  title={`Mood: ${computedMoodInfo.label} (${computedMoodInfo.reason})`}
                >
                  <MoodIcon className="h-3 w-3 animate-pulse" />
                  <span className="capitalize">{activeMood}</span>
                </div>

                <div className="h-4 w-[1px] bg-border mx-0.5" />

                {/* Sleep button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToSleep();
                  }}
                  title="Put Addy to sleep (Zzz)"
                  className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Sleep</span>
                </button>

                <div className="h-4 w-[1px] bg-border mx-0.5" />

                {/* Chat button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatOpen(true);
                  }}
                  title="Chat with Addy"
                  className="rounded-full p-1.5 text-emerald-500 hover:bg-emerald-500/15 hover:scale-110 transition-all cursor-pointer"
                >
                  <Bot className="h-3.5 w-3.5" />
                </button>

                {/* Walk button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerAction("walk", "Let's take a stroll!");
                  }}
                  title="Walk around"
                  className="rounded-full p-1.5 text-amber-500 hover:bg-amber-500/15 hover:scale-110 transition-all cursor-pointer"
                >
                  <Footprints className="h-3.5 w-3.5" />
                </button>

                {/* Jump button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerAction("jump", "Wheee! Up and over!");
                  }}
                  title="Jump & Land"
                  className="rounded-full p-1.5 text-sky-500 hover:bg-sky-500/15 hover:scale-110 transition-all cursor-pointer"
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" />
                </button>

                {/* Hang button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerAction("hang", "Hanging on the top bar!");
                  }}
                  title="Hang from top"
                  className="rounded-full p-1.5 text-purple-500 hover:bg-purple-500/15 hover:scale-110 transition-all cursor-pointer"
                >
                  <Anchor className="h-3.5 w-3.5" />
                </button>

                {/* Dance button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerAction("dance", "Dancing time! 🎵");
                  }}
                  title="Dance"
                  className="rounded-full p-1.5 text-pink-500 hover:bg-pink-500/15 hover:scale-110 transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </button>

                {/* Fall button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerAction("fall", "Slipping and falling down!");
                  }}
                  title="Slip & Fall"
                  className="rounded-full p-1.5 text-orange-500 hover:bg-orange-500/15 hover:scale-110 transition-all cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <div className="h-4 w-[1px] bg-border mx-0.5" />

                {/* Minimize button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMinimized(true);
                  }}
                  title="Hide / Minimize Addy"
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive hover:scale-110 transition-all cursor-pointer"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* 3. The 3D Vector Character Model */}
            <div
              onClick={() => {
                if (isSleeping) {
                  wakeUp();
                } else if (!chatOpen) {
                  setChatOpen(true);
                }
              }}
              className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
              title={
                isSleeping
                  ? "Click to wake Addy up!"
                  : `Addy is ${activeMood}! Click to open chat or drag anywhere!`
              }
            >
              <AddyCharacter
                action={action}
                mood={activeMood}
                facing={facing}
                isTalking={Boolean(bubbleText) || chatBusy}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Window */}
      {chatOpen && (
        <div
          id="addy-chat-popup-container"
          className="fixed bottom-3 sm:bottom-6 right-3 sm:right-6 z-[1000] flex h-[min(32rem,calc(100dvh-2.5rem))] max-h-[calc(100dvh-1.5rem)] w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 sm:gap-3 border-b border-border bg-gradient-to-r from-primary/10 via-muted/40 to-card px-3.5 py-2.5 sm:px-4 sm:py-3 shrink-0">
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-primary/40 bg-background shadow-xs overflow-hidden">
              <img src={addyAvatarSrc} alt="Addy" className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm leading-tight text-foreground truncate">
                  Addy Assistant
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 capitalize",
                    activeMood === "celebrating"
                      ? "border-pink-500/30 bg-pink-500/10 text-pink-600"
                      : activeMood === "focused"
                        ? "border-sky-500/30 bg-sky-500/10 text-sky-600"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
                  )}
                >
                  Mood: {activeMood}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {computedMoodInfo.reason}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quick Mood Selector Chips */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-muted/40 border-b border-border/60 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-muted-foreground font-medium shrink-0">Mood:</span>
            {(["energetic", "focused", "celebrating", "relaxed", "sleepy"] as AddyMood[]).map(
              (m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setManualMood((prev) => (prev === m ? null : m));
                    setBubbleText(`Mood shifted to ${m}!`);
                  }}
                  className={cn(
                    "px-2 py-0.5 rounded-full capitalize font-medium transition-all shrink-0 cursor-pointer text-[10px]",
                    activeMood === m
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-background border border-border/80 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "celebrating"
                    ? "🎉 "
                    : m === "focused"
                      ? "⚡ "
                      : m === "sleepy"
                        ? "🌙 "
                        : ""}
                  {m}
                </button>
              ),
            )}
            {manualMood && (
              <button
                type="button"
                onClick={() => setManualMood(null)}
                className="text-[9px] text-muted-foreground underline ml-1 shrink-0 cursor-pointer"
                title="Reset to automated productivity mood"
              >
                Auto
              </button>
            )}
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 text-xs leading-relaxed"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2 max-w-[90%]",
                  m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto",
                )}
              >
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden border border-primary/40 mt-0.5">
                    <img src={addyAvatarSrc} alt="Addy" className="h-full w-full object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-br-xs"
                      : "bg-muted/70 text-foreground border border-border/60 rounded-bl-xs",
                  )}
                >
                  <div className="prose prose-xs dark:prose-invert max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {chatBusy && (
              <div className="flex gap-2 mr-auto items-center text-muted-foreground text-xs">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full overflow-hidden border border-primary/40 animate-spin">
                  <img src={addyAvatarSrc} alt="Addy" className="h-full w-full object-cover" />
                </div>
                <span>Addy is thinking...</span>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="px-3 py-1.5 bg-muted/20 border-t border-border/40 flex gap-1.5 overflow-x-auto scrollbar-none">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendChat(s)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground whitespace-nowrap transition-colors shrink-0 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendChat(chatInput);
            }}
            className="flex items-center gap-2 border-t border-border p-2.5 sm:p-3 bg-card shrink-0"
          >
            <Input
              ref={inputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Addy about tasks, attendance, leave..."
              className="text-xs h-9"
              disabled={chatBusy}
            />
            <Button
              type="submit"
              size="sm"
              disabled={chatBusy || !chatInput.trim()}
              className="h-9 px-3 shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Auxiliary Bottom Stunts & Controls Dock */}
      {showStuntsBar && !minimized && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[990] flex items-center gap-1.5 rounded-2xl border border-border/80 bg-card/95 px-3 py-1.5 shadow-2xl backdrop-blur max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 pr-2 border-r border-border/60 shrink-0">
            <div className="h-5 w-5 rounded-full overflow-hidden border border-primary/40 shrink-0">
              <img src={addyAvatarSrc} alt="Addy" className="h-full w-full object-cover" />
            </div>
            <span className="text-[11px] font-semibold text-foreground hidden sm:inline">Addy</span>
            {/* Live Mood Indicator */}
            <Badge
              variant="outline"
              className={cn(
                "h-4 text-[9px] px-1.5 font-semibold capitalize",
                isSleeping
                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-500"
                  : activeMood === "celebrating"
                    ? "border-pink-500/30 bg-pink-500/10 text-pink-600"
                    : activeMood === "focused"
                      ? "border-sky-500/30 bg-sky-500/10 text-sky-600"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
              )}
            >
              {isSleeping ? "Asleep 🌙" : `${activeMood}`}
            </Badge>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isSleeping ? (
              <button
                type="button"
                onClick={() => wakeUp()}
                className="flex items-center gap-1 rounded-xl bg-amber-500/15 border border-amber-500/40 px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-500/25 transition-all cursor-pointer animate-pulse"
                title="Wake Addy up"
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Wake Up ☀️</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToSleep()}
                className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
                title="Put Addy to sleep"
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Sleep</span>
              </button>
            )}

            {ACTIONS.filter((a) => a.type !== "sleep" && a.type !== "wake").map((act) => {
              const Icon = act.icon;
              const isActive = action === act.type;
              return (
                <button
                  key={act.type}
                  type="button"
                  onClick={() => triggerAction(act.type)}
                  className={cn(
                    "flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  title={act.label}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{act.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
              title="Open Chat with Addy"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Chat</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowStuntsBar(false)}
            className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            title="Hide bottom stunts bar"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </>
  );
}

const ACTIONS = QUICK_ACTIONS;
