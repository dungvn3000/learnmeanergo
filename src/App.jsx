import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import ArticlePage from './pages/ArticlePage'
import { Beginners, Technical } from './pages/SectionIndex'
import { ToolPage, ToolsIndex } from './pages/Tools'
import Explorer from './pages/explorer/Explorer'
import BlockPage from './pages/explorer/BlockPage'
import TxPage from './pages/explorer/TxPage'
import AddressPage from './pages/explorer/AddressPage'
import BoxPage from './pages/explorer/BoxPage'
import TokenPage from './pages/explorer/TokenPage'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="beginners" element={<Beginners />} />
        <Route path="technical" element={<Technical />} />
        <Route path="learn/:slug" element={<ArticlePage />} />
        <Route path="tools" element={<ToolsIndex />} />
        <Route path="tools/:slug" element={<ToolPage />} />
        <Route path="explorer" element={<Explorer />} />
        <Route path="block/:id" element={<BlockPage />} />
        <Route path="tx/:id" element={<TxPage />} />
        <Route path="address/:addr" element={<AddressPage />} />
        <Route path="box/:id" element={<BoxPage />} />
        <Route path="token/:id" element={<TokenPage />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
