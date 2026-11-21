import type { Icon } from '@/shared/ui/kit/icon';
import { solarIcon } from '../icons';

/** An action's icon: a kit icon as it is, or a meaning name (solarIcon's) as the kit's icon of that name. */
export const iconOf = (icon: string | Icon) => (typeof icon === 'string' ? solarIcon(icon) : icon);
