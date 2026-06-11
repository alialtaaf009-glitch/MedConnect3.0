import StudyTimer from '../components/StudyTimer.jsx';

export default function Focus() {
  return (
    <div className="screen">
      <h1 className="h1">Focus ☕</h1>
      <p className="sub" style={{ marginBottom: 16 }}>
        A timer for your study sessions. Set a block, or count up — tap the box for full-screen. It keeps running while you use the rest of the app.
      </p>
      <StudyTimer />
    </div>
  );
}

