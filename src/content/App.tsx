import React from 'react';
import { RepositoryInfo } from '@shared/types';
import AnalyzeButton from './components/AnalyzeButton';
import AnalysisPanel from './components/AnalysisPanel';
import { useAnalysisStore } from './hooks/useAnalysis';

interface AppProps {
    repoInfo: RepositoryInfo;
}

const App: React.FC<AppProps> = ({ repoInfo }) => {
    // Initialize store with repo info
    React.useEffect(() => {
        useAnalysisStore.getState().setRepoInfo(repoInfo);
    }, [repoInfo]);

    const isPanelOpen = useAnalysisStore((state) => state.isPanelOpen);

    return (
        <>
            <AnalyzeButton />
            {isPanelOpen && <AnalysisPanel />}
        </>
    );
};

export default App;
