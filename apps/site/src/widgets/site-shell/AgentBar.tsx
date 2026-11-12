import { Button } from '@astryxdesign/core/Button';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import styles from './shell.module.css';
const bars = [[0,1],[3,2],[6,1],[9,3],[13,1],[17,1],[20,2],[23,1],[26,3],[30,1],[34,1],[37,2],[40,1],[43,3],[47,1],[51,1]];
export function AgentBar({ onAgent }: { onAgent: () => void }) { return <div className={styles.agentBar}><svg width="52" height="12" viewBox="0 0 52 12" fill="currentColor" opacity="0.5" aria-hidden="true" focusable="false">{bars.map(([x,width]) => <rect key={x} x={x} width={width} height="12" />)}</svg><Button label="Agent" variant="subtle" size="sm" icon={icon('agent')} onClick={onAgent} /></div>; }
