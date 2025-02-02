import DocumentDetailsPage from "./components/DocumentDetailsPage"
import DocumentsListPage from "./components/DocumentListPage"
import Hero from "./components/Hero"
import ExcelImporter from "./components/UploadFile"
import {BrowserRouter, Route, Routes} from "react-router"

const App = () => {
  return (
    <div className="bg-black">
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Hero/>} />
      <Route path="/upload" element={<ExcelImporter />}/>
      <Route path="/documents" element={<DocumentsListPage />} />
      <Route path="/documents/:documentId" element={<DocumentDetailsPage />} />
    </Routes>
  </BrowserRouter>
      
      
    </div>
  )
}

export default App
