import logo from './logo.svg?raw';
import styles from './brand.module.css';
export function WorkflowBrand({ isFolded = false }: { isFolded?: boolean }) {
 return <span className={styles.brand} aria-label="dev-goraebap"><span className={styles.mark} aria-hidden dangerouslySetInnerHTML={{__html: logo}} />{isFolded ? null : <span>dev-goraebap<span className={styles.sub}>Webcraft</span></span>}</span>;
}
