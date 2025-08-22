import { createContext, useContext, useState } from "react";
import { nanoid } from "nanoid"; // install: npm i nanoid

const TicketsContext = createContext(null);
export const useTickets = () => useContext(TicketsContext);

export const TicketsProvider = ({ children }) => {
  const [tickets, setTickets] = useState([
    // starter example
    // { id: 'abc', title: 'Laptop not booting', priority: 'High', status: 'Open', createdAt: new Date().toISOString() }
  ]);

  const addTicket = ({ title, description, priority }) => {
    const newTicket = {
      id: nanoid(8),
      title,
      description,
      priority,
      status: "Open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  };

  const updateTicketStatus = (id, status) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t))
    );
  };

  return (
    <TicketsContext.Provider value={{ tickets, addTicket, updateTicketStatus }}>
      {children}
    </TicketsContext.Provider>
  );
};
