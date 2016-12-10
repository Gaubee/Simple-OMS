import {PositionStrategy} from './position/position-strategy';
import {LayoutDirection} from '../rtl/dir';


/**
 * OverlayState is a bag of values for either the initial configuration or current state of an
 * overlay.
 */
export class OverlayState {
  /** Strategy with which to position the overlay. */
  positionStrategy: PositionStrategy;

  /** Whether the overlay has a backdrop. */
  hasBackdrop: boolean = false;

  /** Custom class to add to the backdrop **/
  backdropClass: string = 'md-overlay-dark-backdrop';

  /** The width of the overlay panel. If a number is provided, pixel units are assumed. **/
  width: number | string;

  /** The height of the overlay panel. If a number is provided, pixel units are assumed. **/
  height: number | string;

  /** The min-width of the overlay panel. If a number is provided, pixel units are assumed. **/
  minWidth: number | string;

  /** The min-height of the overlay panel. If a number is provided, pixel units are assumed. **/
  minHeight: number | string;

  /** The direction of the text in the overlay panel. */
  direction: LayoutDirection = 'ltr';

  // TODO(jelbourn): configuration still to add
  // - focus trap
  // - disable pointer events
  // - z-index
}
