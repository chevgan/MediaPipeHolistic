import { Route, Routes } from "react-router-dom"
import {HomePage} from "./HomePage";
import CameraPageHolistic from "./CameraPageHolistic";
import './App.css'


export function App() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/camera" element={<CameraPageHolistic />} />
        </Routes>
    )
}

export default App;