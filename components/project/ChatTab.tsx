import { ConversationRecord } from "@/store/features/conversations-api";

export default function ChatTab({ chat, setChatId }: { chat: ConversationRecord, setChatId: (id: string) => void }) {
    return (
        <div
            onClick={() => setChatId(chat.id)}
            className="py-2 px-2 hover:bg-gray-300/30 cursor-pointer">
            {chat.title}
        </div>
    )
}
