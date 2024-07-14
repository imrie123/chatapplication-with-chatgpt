"use client";
import React, { useEffect, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { db } from "@/app/firebase";
import { doc } from "firebase/firestore";
import { text } from "stream/consumers";
import { addDoc, serverTimestamp, collection } from "firebase/firestore";
import { useAppContext } from "../context/AppContext";
import {
  onSnapshot,
  query,
  orderBy,
  QuerySnapshot,
  DocmentData,
} from "firebase/firestore";
import OpenAI from "openai";

const Chat = () => {
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
    dangerouslyAllowBrowser: true,
  });
  const { selectedRoom } = useAppContext();
  const [inputMessage, setInputMessage] = useState<string>("");
  interface Message {
    text: string;
    sender: string;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const messageData = {
    text: inputMessage,
    sender: "user",
    createdAt: serverTimestamp(),
  };
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    const messageCollectionRef = collection(
      db,
      "rooms",
      "isNT3WnxIxM4PgR4c7c6",
      "messages"
    ); 
    await addDoc(messageCollectionRef, messageData);
    setInputMessage("");
    const gpt3Response = await openai.chat.completions.create({
      messages: [{ role: "user", content: inputMessage }],
      model: "gpt-3.5-turbo",
    });
    const botResponse = gpt3Response.choices[0].message.content;
    await addDoc(messageCollectionRef, {
      text: botResponse,
      sender: "bot",
      createdAt: serverTimestamp(),
    });
  };

  useEffect(() => {
    if (selectedRoom) {
      const fetchMessages = async () => {
        const roomDocRef = doc(db, "rooms", selectedRoom);
        const messageCollectionRef = collection(roomDocRef, "messages");

        const q = query(messageCollectionRef, orderBy("createdAt"));

        const unsubscribe = onSnapshot(
          q,
          (snapshot: QuerySnapshot<DocmentData>) => {
            const newMessages = snapshot.docs.map((doc: DocmentData) =>
              doc.data()
            );
            setMessages(newMessages);
          }
        );
        return () => {
          unsubscribe();
        };
      };
      fetchMessages();
    }
  }, [selectedRoom]);
  return (
    <div className="bg-gray-500 h-full p-4 flex flex-col">
      <h1 className="text-2xl text-white font-semibold mb-4">Room1</h1>
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.sender === "user" ? "text-right" : "text-left"}
          >
            <div
              className={
                message.sender === "user"
                  ? "bg-blue-500 inline-block rounded px-4 py-2 mb-2"
                  : "bg-green-500 inline-block rounded px-4 py-2 mb-2"
              }
            >
              <p className="text-white">{message.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 relative">
        <input
          type="text"
          placeholder="Send a Message"
          className="border-2 rounded w-full pr-10 focus:outline p-2"
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button
          className="absolute inset-y-0 right-4 flex items-center"
          onClick={() => sendMessage()}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default Chat;
