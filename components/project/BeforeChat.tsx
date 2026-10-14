"use client";

import { useCreateConversationMutation, useListConversationsQuery } from "@/store/features/conversations-api";


export function BeforeChat({ setChatId, projectId }: { setChatId: (id: string) => void, projectId: string }) {
  const { data, isLoading } = useListConversationsQuery({ projectId })
  const [createChat, { data: newChat, isLoading: newChatLoading, error }] = useCreateConversationMutation()
  console.log(newChat, error)
  return (
    <>
      <div className="p-3">
        <div className="mt-4 text-gray-400">
          <h2 className="text-gray-400">Continue with History</h2>
          <div className="pl-4 text-sm">
            <ul className="list-disc">
              <li>Give me some task or not. Just order me what to do and Get it done</li>
              <li>Save your valuable time with me</li>
            </ul>
          </div>
        </div>
        <div className="w-full flex flex-col justify-center items-center mt-8">
          <span className="">- - Or - -</span>
          <button
            onClick={() => createChat({ projectId })}
            className="p-3 bg-gray-500/50 rounded mt-3">Start New Conversation</button>
        </div>

      </div>

    </>
  );
}