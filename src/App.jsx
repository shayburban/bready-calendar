import './App.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import GoogleAuthResultToaster from "@/components/google/GoogleAuthResultToaster"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
      {/* Surfaces Google sign-in / calendar-connect outcomes as toasts on return. */}
      <GoogleAuthResultToaster />
    </>
  )
}

export default App 