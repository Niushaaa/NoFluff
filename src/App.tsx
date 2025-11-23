import React from 'react';
import { useAppState } from './hooks/useAppState';
import { InputScreen } from './components/screens/InputScreen';
import { ProcessingScreen } from './components/screens/ProcessingScreen';
import { PlayerScreen } from './components/screens/PlayerScreen';
import { ExploreScreen } from './components/screens/ExploreScreen';
import './App.css';

function App() {
  const { state, actions } = useAppState();

  const renderCurrentScreen = () => {
    switch (state.currentScreen) {
      case 'input':
        return <InputScreen state={state} actions={actions} />;
      case 'processing':
        return <ProcessingScreen state={state} actions={actions} />;
      case 'player':
        return <PlayerScreen state={state} actions={actions} />;
      case 'explore':
        return <ExploreScreen state={state} actions={actions} />;
      default:
        return <InputScreen state={state} actions={actions} />;
    }
  };

  return (
    <div className="App font-sans">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;