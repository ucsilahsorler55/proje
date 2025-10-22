import { Card, Button, Table, Layout } from "antd";
import { useState } from "react";
import Navbar from "../components/Navbar";

const { Header, Content } = Layout;

const Dashboard = () => {
    const [data] = useState([
        { key: 1, name: "Ahmet", age: 25 },
        { key: 2, name: "Mehmet", age: 30 },
    ]);

    const columns = [
        { title: "Ad", dataIndex: "name", key: "name" },
        { title: "Yaş", dataIndex: "age", key: "age" },
    ];

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Navbar />
            <Header style={{ color: "white", fontSize: 20 }}>
                Clup Management
            </Header>
            <Content style={{ padding: 24 }}>
                <Card title="Kullanıcı Listesi" style={{ marginBottom: 24 }}>
                    <Table
                        dataSource={data}
                        columns={columns}
                        pagination={false}
                    />
                </Card>
                <Card>
                    <Button type="primary">Yeni Kullanıcı Ekle</Button>
                </Card>
            </Content>
        </Layout>
    );
};

export default Dashboard;
