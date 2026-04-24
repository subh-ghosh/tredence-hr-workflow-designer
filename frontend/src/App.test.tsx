import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Increment 1 shell', () => {
    it('renders main shell panels', () => {
        render(<App />)

        expect(screen.getByTestId('panel-sidebar')).toBeInTheDocument()
        expect(screen.getByTestId('panel-canvas')).toBeInTheDocument()
        expect(screen.getByTestId('panel-details')).toBeInTheDocument()
    })

    it('shows app heading', () => {
        render(<App />)

        expect(
            screen.getByRole('heading', { name: /hr workflow designer/i }),
        ).toBeInTheDocument()
    })
})
