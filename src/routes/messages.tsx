import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquarePlus, Plus, Search, Send, UserCheck, Users } from "lucide-react";
import { AppShell, EmptyState, Initials, PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useApp, newId, isoNow, dateKey } from "@/lib/store";
import { fmtDateTime } from "@/lib/format";
import type { Conversation, User } from "@/lib/types";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — SACE Portal" },
      {
        name: "description",
        content: "Direct, group and announcement conversations for the SACE team.",
      },
      { property: "og:title", content: "Messages — SACE Portal" },
      {
        property: "og:description",
        content: "Chat with teammates and read company announcements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <AppShell>
      <MessagesPage />
    </AppShell>
  ),
});

function MessagesPage() {
  const { state, me, update, notify } = useApp();
  const isAdmin = me!.role !== "member";
  const [newChatOpen, setNewChatOpen] = React.useState(false);
  const [convoSearch, setConvoSearch] = React.useState("");

  // All conversations where me is participant, plus for admins they can see all or start with anyone
  const mine = state.conversations.filter(
    (c) => c.participantIds.includes(me!.id) || (isAdmin && c.kind === "announcement"),
  );

  const filteredConversations = mine.filter((c) => {
    if (!convoSearch) return true;
    return c.name.toLowerCase().includes(convoSearch.toLowerCase());
  });

  const [activeId, setActiveId] = React.useState<string | null>(mine[0]?.id ?? null);
  const [draft, setDraft] = React.useState("");

  // Ensure activeId is valid
  React.useEffect(() => {
    if (mine.length > 0 && (!activeId || !mine.some((c) => c.id === activeId))) {
      setActiveId(mine[0].id);
    }
  }, [mine, activeId]);

  const active = state.conversations.find((c) => c.id === activeId) ?? null;
  const thread = state.messages
    .filter((m) => m.conversationId === active?.id)
    .sort((a, b) => a.at.localeCompare(b.at));

  // Determine other participant if 1:1
  const otherParticipantId = active?.participantIds.find((id) => id !== me!.id);
  const otherParticipant = state.users.find((u) => u.id === otherParticipantId);

  // Check if active user is punched in today
  const todayKey = dateKey(new Date());
  const otherUserPunchedIn = otherParticipant
    ? state.attendance.some(
        (a) => a.userId === otherParticipant.id && a.date === todayKey && a.punchIn && !a.punchOut,
      )
    : false;

  const send = () => {
    if (!draft.trim() || !active) return;
    const body = draft.trim();
    setDraft("");
    update((d) => {
      d.messages.push({
        id: newId(),
        conversationId: active.id,
        senderId: me!.id,
        body,
        at: isoNow(),
        readBy: [me!.id],
      });
    });

    // Notify other participants
    active.participantIds.forEach((pid) => {
      if (pid !== me!.id) {
        notify(
          pid,
          `Message from ${me?.fullName}`,
          body.length > 50 ? `${body.substring(0, 47)}…` : body,
          "/messages",
        );
      }
    });
  };

  const handleStartDirectChat = (targetUser: User) => {
    // Check if 1:1 direct chat already exists
    const existing = state.conversations.find(
      (c) =>
        c.kind === "direct" &&
        c.participantIds.length === 2 &&
        c.participantIds.includes(me!.id) &&
        c.participantIds.includes(targetUser.id),
    );

    if (existing) {
      setActiveId(existing.id);
      setNewChatOpen(false);
      return;
    }

    // Create new direct conversation
    const newConvId = newId();
    const newConv: Conversation = {
      id: newConvId,
      name: targetUser.fullName,
      kind: "direct",
      participantIds: [me!.id, targetUser.id],
    };

    update((d) => {
      d.conversations.unshift(newConv);
    });

    setActiveId(newConvId);
    setNewChatOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Messages"
        description="Direct 1:1 chats, team channels, and company-wide announcements."
        actions={
          <Button size="sm" onClick={() => setNewChatOpen(true)} className="gap-1.5 shadow-sm">
            <MessageSquarePlus className="h-4 w-4" /> Start chat
          </Button>
        }
      />

      {mine.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          hint="Click 'Start chat' to begin a 1:1 conversation with any team member."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* Conversations sidebar */}
          <Card className="rounded-2xl flex flex-col h-[72vh]">
            <div className="p-3 border-b border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversations ({filteredConversations.length})
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setNewChatOpen(true)}
                  title="New conversation"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="h-8 pl-8 text-xs"
                  placeholder="Search chats…"
                  value={convoSearch}
                  onChange={(e) => setConvoSearch(e.target.value)}
                />
              </div>
            </div>

            <CardContent className="flex-1 overflow-y-auto space-y-1 p-2">
              {filteredConversations.map((c) => {
                const isSelected = c.id === activeId;
                const isDirect = c.kind === "direct";
                const otherId = c.participantIds.find((id) => id !== me!.id);
                const other = isDirect ? state.users.find((u) => u.id === otherId) : null;
                const displayName = isDirect && other ? other.fullName : c.name;
                const avatarColor = other ? other.avatarColor : undefined;

                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    <div className="relative shrink-0">
                      <Initials
                        name={displayName}
                        color={avatarColor}
                        src={other?.avatarUrl}
                        size={32}
                      />
                      {other && (
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card",
                            otherUserPunchedIn ? "bg-emerald-500" : "bg-muted-foreground/40",
                          )}
                          title={
                            otherUserPunchedIn ? "Punched in today" : "Offline / not punched in"
                          }
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="block truncate text-xs font-semibold">{displayName}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {c.kind}
                        </span>
                      </div>
                      {other?.designation && (
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {other.designation}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Active Chat Area */}
          <Card className="flex h-[72vh] flex-col rounded-2xl">
            {active ? (
              <>
                {/* Active Chat Header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Initials
                      name={otherParticipant ? otherParticipant.fullName : active.name}
                      color={otherParticipant?.avatarColor}
                      src={otherParticipant?.avatarUrl}
                      size={36}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-foreground">
                          {otherParticipant ? otherParticipant.fullName : active.name}
                        </h2>
                        {otherParticipant && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                              otherUserPunchedIn
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                otherUserPunchedIn ? "bg-emerald-500" : "bg-muted-foreground",
                              )}
                            />
                            {otherUserPunchedIn ? "Punched In" : "Off Duty"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {otherParticipant
                          ? `${otherParticipant.designation} · ${otherParticipant.department}`
                          : `${active.participantIds.length} members · ${active.kind}`}
                      </p>
                    </div>
                  </div>
                </div>

                <CardContent className="flex flex-1 flex-col gap-4 p-5 overflow-hidden">
                  <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                    {thread.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-center">
                        <div className="text-muted-foreground text-sm">
                          <p className="font-medium">No messages in this chat yet.</p>
                          <p className="text-xs mt-1">Say hello to get the conversation started.</p>
                        </div>
                      </div>
                    ) : (
                      thread.map((m) => {
                        const mineMsg = m.senderId === me!.id;
                        const sender = state.users.find((u) => u.id === m.senderId);
                        return (
                          <div key={m.id} className={cn("flex", mineMsg && "justify-end")}>
                            <div
                              className={cn(
                                "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-xs",
                                mineMsg
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-foreground",
                              )}
                            >
                              {!mineMsg && (
                                <p className="mb-0.5 text-xs font-semibold">{sender?.fullName}</p>
                              )}
                              <p className="whitespace-pre-wrap">{m.body}</p>
                              <p
                                className={cn(
                                  "mt-1 text-[10px]",
                                  mineMsg ? "text-primary-foreground/75" : "text-muted-foreground",
                                )}
                              >
                                {fmtDateTime(m.at)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form
                    className="flex gap-2 pt-2 border-t border-border"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send();
                    }}
                  >
                    <Input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={
                        active?.kind === "announcement"
                          ? "Post an announcement to the team…"
                          : `Message ${otherParticipant ? otherParticipant.fullName : active.name}…`
                      }
                      aria-label="Message"
                      className="text-sm"
                    />
                    <Button
                      type="submit"
                      size="default"
                      disabled={!draft.trim()}
                      className="gap-1.5"
                    >
                      <Send className="h-4 w-4" /> Send
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <EmptyState
                  title="No conversation selected"
                  hint="Select a conversation on the left or start a new chat."
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Start Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Start a conversation</DialogTitle>
            <DialogDescription>
              Select any team member to start an instant private 1:1 chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Team Members ({state.users.filter((u) => u.id !== me!.id && u.active).length})
              </p>
              <div className="space-y-1">
                {state.users
                  .filter((u) => u.id !== me!.id && u.active)
                  .map((u) => {
                    const isPunchedIn = state.attendance.some(
                      (a) => a.userId === u.id && a.date === todayKey && a.punchIn && !a.punchOut,
                    );
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleStartDirectChat(u)}
                        className="flex w-full items-center justify-between rounded-xl border border-transparent p-2.5 text-left transition hover:border-border hover:bg-muted/70"
                      >
                        <div className="flex items-center gap-3">
                          <Initials
                            name={u.fullName}
                            color={u.avatarColor}
                            src={u.avatarUrl}
                            size={34}
                          />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{u.fullName}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {u.designation} · {u.department}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={cn(
                              "inline-block h-2 w-2 rounded-full",
                              isPunchedIn ? "bg-emerald-500" : "bg-muted-foreground/30",
                            )}
                            title={isPunchedIn ? "Punched in today" : "Offline"}
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
