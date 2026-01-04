import { render } from '@testing-library/react';
import { Canvas } from '../Canvas';

// Mock ResizeObserver (already in setup but just in case for component internals)

describe('Canvas Component', () => {
    it('renders without crashing', () => {
        const { container } = render(<Canvas />);
        expect(container).toBeInTheDocument();
    });
});
