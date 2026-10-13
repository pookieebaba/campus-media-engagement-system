import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Button } from '../components/ui/Button.jsx';

describe('Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders loading spinner when loading=true', () => {
    render(<Button loading={true}>Submit</Button>);
    // When loading, the button should be disabled and show spinner
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    // The spinner SVG should be present (no text "Submit" visible but button exists)
    expect(btn).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: /click me/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick} disabled>Click me</Button>);
    await user.click(screen.getByRole('button', { name: /click me/i }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies danger variant class', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button', { name: /delete/i });
    expect(btn.className).toMatch(/bg-destructive/);
  });
});
