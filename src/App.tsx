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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
