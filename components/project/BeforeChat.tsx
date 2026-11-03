"use client";

import { useCreateConversationMutation, useListConversationsQuery } from "@/store/features/conversations-api";
import { useEffect } from "react";
import ChatTab from "./ChatTab";


export function BeforeChat({ setChatId, projectId }: { setChatId: (id: string) => void, projectId: string }) {
  const { data } = useListConversationsQuery({ projectId })
  const [createChat, { data: newChat }] = useCreateConversationMutation()

  useEffect(() => {
    if (newChat) setChatId(newChat?.conversation?.id || "")
  }, [newChat])
  return (
    <>
      <div className="p-3">
        <div className="mt-4 text-gray-400">
          <div className="w-full flex flex-col items- mt-8">
            <button
              onClick={() => createChat({ projectId })}
              className="p-3 bg-gray-500/50 rounded mt-3">Start New Conversation</button>
          </div>
          <h2 className="text-gray-400">Continue with History</h2>
          <div className="h-[calc(100vh-8.5rem)] overflow-y-auto scrollbar-none">
            {
              data?.conversations?.map((item) => (
                <ChatTab setChatId={setChatId} key={item.id} chat={item} />
              ))
            }
          </div>


          {data?.conversations?.length==0 &&<div className="pl-4 text-sm">
            <ul className="list-disc">
              <li>Give me some task or not. Just order me what to do and Get it done</li>
              <li>Save your valuable time with me</li>
            </ul>
          </div>}
        </div>
      </div>
    </>
  );
}