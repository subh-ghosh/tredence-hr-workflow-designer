import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

class ResizeObserverMock {
    observe() { }

    unobserve() { }

    disconnect() { }
}

// React Flow uses ResizeObserver internally. JSDOM does not provide it by default.
if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}

afterEach(() => {
    cleanup()
})
