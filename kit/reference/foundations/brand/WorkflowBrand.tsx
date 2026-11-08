import logo from './logo.svg?raw';
import styles from './brand.module.css';
export function WorkflowBrand({ isFolded = false }: { isFolded?: boolean }) {
 return <span className={styles.brand} aria-label="고래밥 워크플로우"><span className={styles.mark} aria-hidden dangerouslySetInnerHTML={{__html: logo}} />{isFolded ? null : <span>고래밥<span className={styles.sub}>워크플로우</span></span>}</span>;
}
