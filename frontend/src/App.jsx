import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Login from './pages/Login';

// Public pages
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/Home';
import About from './pages/About';
import WhyResell from './pages/WhyResell';
import Register from './pages/Register';
import VitrinePage from './pages/VitrinePage';

// Auth & Painel
import AuthGuard from './components/painel/AuthGuard';
import PainelLayout from './components/painel/PainelLayout';
import MatrizDashboard from './pages/painel/matriz/MatrizDashboard';
import GestaoFiliais from './pages/painel/matriz/GestaoFiliais';
import RevendedorasNacional from './pages/painel/matriz/RevendedorasNacional';
import EstoqueCentral from './pages/painel/matriz/EstoqueCentral';
import FinanceiroMatriz from './pages/painel/matriz/FinanceiroMatriz';
import RelatoriosMatriz from './pages/painel/matriz/RelatoriosMatriz';
import GestaoUsuarios from './pages/painel/matriz/GestaoUsuarios';
import ConfiguracoesSistema from './pages/painel/matriz/ConfiguracoesSistema';
import FilialDashboard from './pages/painel/filial/FilialDashboard';
import Revendedoras from './pages/painel/filial/Revendedoras';
import GestaoPastas from './pages/painel/filial/GestaoPasstas';
import Estoque from './pages/painel/filial/Estoque';
import FinanceiroFilial from './pages/painel/filial/FinanceiroFilial';
import Contratos from './pages/painel/filial/Contratos';
import Agenda from './pages/painel/filial/Agenda';
import Etiquetas from './pages/painel/filial/Etiquetas';
import GestaoGamificacao from './pages/painel/filial/GestaoGamificacao';
import TransferenciasMatriz from './pages/painel/matriz/TransferenciasMatriz';
import ReposicaoMatriz from './pages/painel/matriz/ReposicaoMatriz';
import InteligenciaEstoque from './pages/painel/matriz/InteligenciaEstoque';
import TransferenciasFilial from './pages/painel/filial/TransferenciasFilial';
import ReposicaoEstoque from './pages/painel/filial/ReposicaoEstoque';
import KanbanProgresso from './pages/painel/filial/KanbanProgresso';
import MessageTemplates from './pages/painel/filial/MessageTemplates';
import Metas from './pages/painel/filial/Metas';
import MetasMatriz from './pages/painel/matriz/Metas';
import RevendedoraDashboard from './pages/painel/revendedora/RevendedoraDashboard';
import MinhaPasta from './pages/painel/revendedora/MinhaPasta';
import RegistrarVendas from './pages/painel/revendedora/RegistrarVendas';
import MeuFinanceiro from './pages/painel/revendedora/MeuFinanceiro';
import MinhaVitrine from './pages/painel/revendedora/MinhaVitrine';
import MateriaisDivulgacao from './pages/painel/revendedora/MateriaisDivulgacao';
import AreaConhecimento from './pages/painel/revendedora/AreaConhecimento';
import Gamificacao from './pages/painel/revendedora/Gamificacao';
import PlaceholderPage from './pages/painel/PlaceholderPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#F5F0E8" }}>
        <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Vitrine pública — sem login */}
      <Route path="/vitrine/:code" element={<VitrinePage />} />

      {/* ── Painel Matriz ── */}
      <Route element={<AuthGuard requiredRole="matriz" />}>
        <Route element={<PainelLayout />}>
          <Route path="/painel/matriz/dashboard" element={<MatrizDashboard />} />
          <Route path="/painel/matriz/filiais" element={<GestaoFiliais />} />
          <Route path="/painel/matriz/revendedoras" element={<RevendedorasNacional />} />
          <Route path="/painel/matriz/estoque" element={<EstoqueCentral />} />
          <Route path="/painel/matriz/financeiro" element={<FinanceiroMatriz />} />
          <Route path="/painel/matriz/relatorios" element={<RelatoriosMatriz />} />
          <Route path="/painel/matriz/usuarios" element={<GestaoUsuarios />} />
          <Route path="/painel/matriz/configuracoes" element={<ConfiguracoesSistema />} />
          <Route path="/painel/matriz/gamificacao" element={<GestaoGamificacao />} />
          <Route path="/painel/matriz/templates" element={<MessageTemplates />} />
          <Route path="/painel/matriz/metas" element={<MetasMatriz />} />
          <Route path="/painel/matriz/transferencias" element={<TransferenciasMatriz />} />
          <Route path="/painel/matriz/reposicao" element={<ReposicaoMatriz />} />
          <Route path="/painel/matriz/inteligencia-estoque" element={<InteligenciaEstoque />} />
        </Route>
      </Route>

      {/* ── Painel Filial ── */}
      <Route element={<AuthGuard requiredRole="filial" />}>
        <Route element={<PainelLayout />}>
          <Route path="/painel/filial/dashboard" element={<FilialDashboard />} />
          <Route path="/painel/filial/revendedoras" element={<Revendedoras />} />
          <Route path="/painel/filial/pastas" element={<GestaoPastas />} />
          <Route path="/painel/filial/estoque" element={<Estoque />} />
          <Route path="/painel/filial/financeiro" element={<FinanceiroFilial />} />
          <Route path="/painel/filial/contratos" element={<Contratos />} />
          <Route path="/painel/filial/agenda" element={<Agenda />} />
          <Route path="/painel/filial/etiquetas" element={<Etiquetas />} />
          <Route path="/painel/filial/gamificacao" element={<GestaoGamificacao />} />
          <Route path="/painel/filial/kanban" element={<KanbanProgresso />} />
          <Route path="/painel/filial/templates" element={<MessageTemplates />} />
          <Route path="/painel/filial/metas" element={<Metas />} />
          <Route path="/painel/filial/transferencias" element={<TransferenciasFilial />} />
          <Route path="/painel/filial/reposicao" element={<ReposicaoEstoque />} />
        </Route>
      </Route>

      {/* ── Painel Revendedora ── */}
      <Route element={<AuthGuard requiredRole="revendedora" />}>
        <Route element={<PainelLayout />}>
          <Route path="/painel/revendedora/dashboard" element={<RevendedoraDashboard />} />
          <Route path="/painel/revendedora/pasta" element={<MinhaPasta />} />
          <Route path="/painel/revendedora/vendas" element={<RegistrarVendas />} />
          <Route path="/painel/revendedora/financeiro" element={<MeuFinanceiro />} />
          <Route path="/painel/revendedora/vitrine" element={<MinhaVitrine />} />
          <Route path="/painel/revendedora/materiais" element={<MateriaisDivulgacao />} />
          <Route path="/painel/revendedora/aprendizado" element={<AreaConhecimento />} />
          <Route path="/painel/revendedora/gamificacao" element={<Gamificacao />} />
        </Route>
      </Route>

      {/* ── Site Público ── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/quem-somos" element={<About />} />
        <Route path="/seja-revendedora" element={<WhyResell />} />
        <Route path="/cadastro" element={<Register />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App