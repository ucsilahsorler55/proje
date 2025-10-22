import { useState } from "react";
import "./App.css";
import "antd/dist/reset.css";
import { Button } from "antd";

function App() {
    return (
        <>
            <div>VERİTABANINDAN GELEN YAZI BURADA OLACAK</div>
            <h1>Ant Design Örneği</h1>
            <Button type="primary">Kaydet</Button>
            <Button danger>Sil</Button>
        </>
    );
}

export default App;
