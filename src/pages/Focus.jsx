import StudyTimer from '../components/StudyTimer.jsx';

export default function Focus() {
  return (
    <div className="screen">
      <h1 className="h1">Focus ☕</h1>
      <p className="sub" style={{ marginBottom: 16 }}>
        Chai in hand? Good. Set a block, tap the box for full-screen, and guard it like an exam hall. ☕
      </p>
      <StudyTimer />
    </div>
  );
}

