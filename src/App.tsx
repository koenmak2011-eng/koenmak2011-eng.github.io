import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import GamesHub from "./pages/GamesHub.tsx";
import Index from "./pages/Index.tsx";
import TicTacToe from "./pages/TicTacToe.tsx";
import Checkers from "./pages/Checkers.tsx";
import Videos from "./pages/Videos.tsx";
import NotFound from "./pages/NotFound.tsx";
import Abhay from "./pages/Abhay.tsx";
import Plague from "./pages/Plague.tsx";
import CapyDash from "./pages/CapyDash.tsx";
import TrashCapy from "./pages/TrashCapy.tsx";
import Create from "./pages/Create.tsx";
import Play from "./pages/Play.tsx";
import CapyCraft from "./pages/CapyCraft.tsx";
import OnlineChess from "./pages/OnlineChess.tsx";
import AmericaBanner from "./components/AmericaBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AmericaBanner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GamesHub />} />
          <Route path="/chess" element={<Index />} />
          <Route path="/tictactoe" element={<TicTacToe />} />
          <Route path="/checkers" element={<Checkers />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/abhay" element={<Abhay />} />
          <Route path="/plague" element={<Plague />} />
          <Route path="/capydash" element={<CapyDash />} />
          <Route path="/trashcapy" element={<TrashCapy />} />
          <Route path="/create" element={<Create />} />
          <Route path="/play/:id" element={<Play />} />
          <Route path="/capycraft" element={<CapyCraft />} />
          <Route path="/online" element={<OnlineChess />} />
          <Route path="/online/:id" element={<OnlineChess />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
