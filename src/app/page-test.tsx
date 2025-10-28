export default function Home() {
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>Test Jira App</h1>
            <p>If you see this, Next.js is working!</p>
            <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
                <p>Server should be running on port 3000</p>
                <p>Current time: {new Date().toLocaleString()}</p>
            </div>
        </div>
    )
}