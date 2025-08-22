import React, { useEffect } from "react";
import axiosInstance from "../services/axiosInstance";

const Tickets = () => {

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axiosInstance.get("/tickets");
        console.log(res.data);
      } catch (err) {
        console.error(err.response?.data || err.message);
      }
    };

    fetchTickets();
  }, []);

  return <div>Check console for tickets data</div>;
};

export default Tickets;
