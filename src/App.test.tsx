import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeInTheDocument()
  })

  it('renders "Get started" heading', () => {
    render(<App />)
    expect(screen.getByText('Get started')).toBeInTheDocument()
  })
})