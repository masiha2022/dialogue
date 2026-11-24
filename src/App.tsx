/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { HomeBackdropArt } from './components/HomeBackdropArt';
import { CustomizationModal } from './components/modals/CustomizationModal';
import { ImportScenarioModal } from './components/modals/ImportScenarioModal';
import { InAppGuideModal } from './components/modals/InAppGuideModal';
import { ScenarioRulesModal } from './components/modals/ScenarioRulesModal';
import { ShareScenarioModal } from './components/modals/ShareScenarioModal';
import { DistributionCompleteScreen } from './components/screens/DistributionCompleteScreen';
import { GameSetupScreen } from './components/screens/GameSetupScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { ModeratorReadyScreen } from './components/screens/ModeratorReadyScreen';
import { ModeratorToolsScreen } from './components/screens/ModeratorToolsScreen';
import { RoleRevealScreen } from './components/screens/RoleRevealScreen';
import { ScenarioEditorScreen } from './components/screens/ScenarioEditorScreen';
import { ScenariosScreen } from './components/screens/ScenariosScreen';
import {
  ActiveGameSession,
  AppPreferences,
  AppScreen,
  RevealMode,
  RoleDefinition,
  Scenario,
  ScenarioTierKey,
} from './types/game';
import { buildShuffledDeck, generateLocalId } from './utils/persian';
import {
  loadActiveSession,
  loadAppPreferences,
  loadScenarios,
  mergeDefaultLibrary,
  saveActiveSession,
  saveAppPreferences,
  saveGuideDismissed,
  saveModeratorMatchState,
  saveScenarios,
} from './utils/storage';

export default function App() {
  const [scenarios, setScenarios] = useState<Scenario[]>(() => loadScenarios());
  const [preferences, setPreferences] = useState<AppPreferences>(() => loadAppPreferences());
  const [screen, setScreen] = useState<AppScreen>('home');
  const [toolsReturnScreen, setToolsReturnScreen] = useState<'home' | 'scenarios' | 'complete'>('home');
  const [toolsWithSession, setToolsWithSession] = useState<boolean>(false);

  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [setupScenarioId, setSetupScenarioId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveGameSession | null>(() =>
    loadActiveSession()
  );

  // Modals state
  const [rulesModalTarget, setRulesModalTarget] = useState<{
    scenario: Scenario;
    tierKey?: ScenarioTierKey;
  } | null>(null);
  const [shareModalTarget, setShareModalTarget] = useState<Scenario | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideInitialStep, setGuideInitialStep] = useState(0);

  useEffect(() => {
    saveScenarios(scenarios);
  }, [scenarios]);

  useEffect(() => {
    saveAppPreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    const isDark = preferences.themeMode !== 'light';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#090B10' : '#F4F5F7');
    }
  }, [preferences.themeMode]);

  useEffect(() => {
    saveActiveSession(activeSession);
  }, [activeSession]);

  // Lock Android/browser back navigation during secret role distribution
  useEffect(() => {
    if (screen !== 'reveal') return;

    window.history.pushState({ revealLock: true }, '');
    const handlePopState = () => {
      window.history.pushState({ revealLock: true }, '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [screen]);

  const handleToggleTheme = () => {
    setPreferences((prev) => ({
      ...prev,
      themeMode: prev.themeMode === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleCreateScenario = () => {
    setEditingScenario(null);
    setScreen('editor');
  };

  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setScreen('editor');
  };

  const handleSaveScenario = (saved: Scenario) => {
    setScenarios((prev) => {
      const exists = prev.some((s) => s.id === saved.id);
      if (exists) {
        return prev.map((s) => (s.id === saved.id ? saved : s));
      }
      return [saved, ...prev];
    });
    setEditingScenario(null);
    setScreen('scenarios');
  };

  const handleImportScenario = (imported: Scenario) => {
    setScenarios((prev) => [imported, ...prev]);
  };

  const handleRestoreLibrary = () => {
    setScenarios((prev) => mergeDefaultLibrary(prev));
  };

  const handleDeleteScenario = (scenarioId: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
    setEditingScenario(null);
    setScreen('scenarios');
  };

  const handleDuplicateScenario = (scenario: Scenario) => {
    const deepCloneTier = (tier: Scenario['tiers']['basic']) => ({
      ...tier,
      roles: tier.roles.map((r) => ({ ...r })),
    });
    const duplicated: Scenario = {
      ...scenario,
      id: generateLocalId('scen'),
      name: `${scenario.name} (کپی)`,
      isBuiltIn: false,
      updatedAt: Date.now(),
      tiers: {
        basic: deepCloneTier(scenario.tiers.basic),
        advanced: deepCloneTier(scenario.tiers.advanced),
        expert: deepCloneTier(scenario.tiers.expert),
      },
      rules: {
        overview: scenario.rules.overview,
        winConditions: [...scenario.rules.winConditions],
        nightOrder: [...scenario.rules.nightOrder],
        keyMechanics: [...scenario.rules.keyMechanics],
        dayAndVoting: [...scenario.rules.dayAndVoting],
      },
    };
    setScenarios((prev) => {
      const idx = prev.findIndex((s) => s.id === scenario.id);
      if (idx === -1) return [duplicated, ...prev];
      const next = [...prev];
      next.splice(idx + 1, 0, duplicated);
      return next;
    });
  };

  const handleStartGameSetup = (scenario: Scenario) => {
    setSetupScenarioId(scenario.id);
    setScreen('setup');
  };

  const handlePrepareDistribution = (
    scenario: Scenario,
    tierKey: ScenarioTierKey,
    tierLabel: string,
    playerCount: number,
    rolesToDeal: RoleDefinition[],
    playerNames: string[],
    chosenRevealMode: RevealMode
  ) => {
    const deck = buildShuffledDeck(rolesToDeal, playerNames);
    saveModeratorMatchState(null);
    setActiveSession({
      id: generateLocalId('session'),
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      tierKey,
      tierLabel,
      playerCount,
      playerNames,
      revealMode: chosenRevealMode,
      rolesUsed: rolesToDeal,
      rules: scenario.rules,
      deck,
      createdAt: Date.now(),
    });
    setScreen('ready');
  };

  const handleReshuffleSession = () => {
    if (!activeSession) return;
    setActiveSession({
      ...activeSession,
      id: generateLocalId('session'),
      deck: buildShuffledDeck(activeSession.rolesUsed, activeSession.playerNames),
    });
  };

  const handleReplaySameSetup = () => {
    if (!activeSession) {
      setScreen('home');
      return;
    }
    saveModeratorMatchState(null);
    setActiveSession({
      ...activeSession,
      id: generateLocalId('session'),
      deck: buildShuffledDeck(activeSession.rolesUsed, activeSession.playerNames),
      createdAt: Date.now(),
    });
    setScreen('ready');
  };

  const handleDiscardSession = () => {
    setActiveSession(null);
    saveModeratorMatchState(null);
  };

  const openSessionRules = () => {
    if (!activeSession) return;
    const found = scenarios.find((s) => s.id === activeSession.scenarioId);
    if (found) {
      setRulesModalTarget({ scenario: found, tierKey: activeSession.tierKey });
    }
  };

  const selectedSetupScenario =
    scenarios.find((s) => s.id === setupScenarioId) ?? scenarios[0];

  return (
    <>
      {screen !== 'reveal' && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#F4F5F7] dark:bg-[#090B10] transition-colors"
        >
          <HomeBackdropArt
            backdropId={preferences.homeBackdropId}
            customDataUrl={preferences.homeBackdropCustomDataUrl}
            isDark={preferences.themeMode !== 'light'}
          />
          <div
            className={`absolute inset-0 transition-colors ${
              screen === 'home'
                ? preferences.homeBackdropId === 'logo'
                  ? 'bg-transparent'
                  : 'bg-gradient-to-b from-[#F4F5F7]/55 via-[#F4F5F7]/20 to-[#F4F5F7]/75 dark:from-[#090B10]/65 dark:via-[#090B10]/25 dark:to-[#090B10]/85'
                : 'bg-[#F4F5F7]/80 dark:bg-[#090B10]/82'
            }`}
          />
        </div>
      )}

      {screen === 'editor' ? (
        <ScenarioEditorScreen
          initialScenario={editingScenario}
          hapticEnabled={preferences.hapticFeedbackEnabled}
          isDark={preferences.themeMode !== 'light'}
          onSave={handleSaveScenario}
          onCancel={() => {
            setEditingScenario(null);
            setScreen('scenarios');
          }}
          onShareScenario={(scenario) => setShareModalTarget(scenario)}
          onDuplicateScenario={handleDuplicateScenario}
          onDeleteScenario={handleDeleteScenario}
        />
      ) : screen === 'scenarios' ? (
        <ScenariosScreen
          scenarios={scenarios}
          hapticEnabled={preferences.hapticFeedbackEnabled}
          onBackHome={() => setScreen('home')}
          onCreateScenario={handleCreateScenario}
          onEditScenario={handleEditScenario}
          onStartGame={handleStartGameSetup}
          onOpenRules={(scenario) => setRulesModalTarget({ scenario, tierKey: 'basic' })}
          onOpenImport={() => setShowImportModal(true)}
          onRestoreLibrary={handleRestoreLibrary}
          onOpenTools={() => {
            setToolsWithSession(Boolean(activeSession));
            setToolsReturnScreen('scenarios');
            setScreen('tools');
          }}
          onOpenCustomization={() => setShowCustomizationModal(true)}
        />
      ) : screen === 'setup' && selectedSetupScenario ? (
        <GameSetupScreen
          scenario={selectedSetupScenario}
          preferences={preferences}
          onOpenCustomization={() => setShowCustomizationModal(true)}
          onBack={() => setScreen('scenarios')}
          onOpenRules={(scenario, tierKey) => setRulesModalTarget({ scenario, tierKey })}
          onStartDistribution={handlePrepareDistribution}
        />
      ) : screen === 'ready' && activeSession ? (
        <ModeratorReadyScreen
          scenarioName={activeSession.scenarioName}
          tierLabel={activeSession.tierLabel}
          playerCount={activeSession.playerCount}
          hapticEnabled={preferences.hapticFeedbackEnabled}
          onStartReveal={() => setScreen('reveal')}
          onReshuffle={handleReshuffleSession}
          onOpenRules={openSessionRules}
          onBackToSetup={() => setScreen('setup')}
        />
      ) : screen === 'reveal' && activeSession ? (
        <RoleRevealScreen
          deck={activeSession.deck}
          scenarioName={activeSession.scenarioName}
          tierLabel={activeSession.tierLabel}
          revealMode={activeSession.revealMode}
          preferences={preferences}
          onComplete={() => setScreen('complete')}
          onAbortGame={() => setScreen('setup')}
        />
      ) : screen === 'complete' && activeSession ? (
        <DistributionCompleteScreen
          session={activeSession}
          hapticEnabled={preferences.hapticFeedbackEnabled}
          isDark={preferences.themeMode !== 'light'}
          onGoHome={() => {
            setScreen('home');
          }}
          onReplaySameSetup={handleReplaySameSetup}
          onOpenRules={openSessionRules}
          onOpenTools={() => {
            setToolsWithSession(true);
            setToolsReturnScreen('complete');
            setScreen('tools');
          }}
        />
      ) : screen === 'tools' ? (
        <ModeratorToolsScreen
          session={toolsWithSession ? activeSession : null}
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onOpenCustomization={() => setShowCustomizationModal(true)}
          onBack={() => setScreen(toolsReturnScreen)}
          onOpenRules={toolsWithSession && activeSession ? openSessionRules : undefined}
          onOpenGuide={() => {
            setGuideInitialStep(2);
            setShowGuideModal(true);
          }}
        />
      ) : (
        <HomeScreen
          activeSession={activeSession}
          themeMode={preferences.themeMode}
          hapticEnabled={preferences.hapticFeedbackEnabled}
          onToggleTheme={handleToggleTheme}
          onStartSelectScenario={() => setScreen('scenarios')}
          onOpenScenarios={() => setScreen('scenarios')}
          onOpenTools={() => {
            setToolsWithSession(Boolean(activeSession));
            setToolsReturnScreen('home');
            setScreen('tools');
          }}
          onResumeActiveTools={() => {
            setToolsWithSession(true);
            setToolsReturnScreen('home');
            setScreen('tools');
          }}
          onDiscardActiveSession={handleDiscardSession}
          onOpenGuide={() => {
            setGuideInitialStep(0);
            setShowGuideModal(true);
          }}
          onOpenCustomization={() => setShowCustomizationModal(true)}
        />
      )}

      {rulesModalTarget && (
        <ScenarioRulesModal
          scenario={rulesModalTarget.scenario}
          initialTierKey={rulesModalTarget.tierKey}
          isDark={preferences.themeMode !== 'light'}
          onClose={() => setRulesModalTarget(null)}
        />
      )}

      {shareModalTarget && (
        <ShareScenarioModal
          scenario={shareModalTarget}
          onClose={() => setShareModalTarget(null)}
        />
      )}

      {showImportModal && (
        <ImportScenarioModal
          onImport={handleImportScenario}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showCustomizationModal && (
        <CustomizationModal
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          onClose={() => setShowCustomizationModal(false)}
        />
      )}

      {showGuideModal && (
        <InAppGuideModal
          initialStep={guideInitialStep}
          onDismissBanner={() => {
            saveGuideDismissed(true);
          }}
          onClose={() => setShowGuideModal(false)}
        />
      )}
    </>
  );
}
