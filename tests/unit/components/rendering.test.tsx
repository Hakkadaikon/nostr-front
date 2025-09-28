import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ComposeBox from '../../../components/compose/ComposeBox';
import NoteCard from '../../../components/notes/NoteCard';
import ProfileEditor from '../../../components/profile/ProfileEditor';

describe('components rendering', () => {
  it('renders ComposeBox', () => {
    render(<ComposeBox />);
    expect(screen.getByPlaceholderText("What's happening?")).toBeInTheDocument();
  });
  it('renders NoteCard with content', () => {
    render(<NoteCard id="x" content="hello" />);
    expect(screen.getByText('hello')).toBeInTheDocument();
  });
  it('renders ProfileEditor', () => {
    render(<ProfileEditor />);
    expect(screen.getByPlaceholderText('Display name')).toBeInTheDocument();
  });
});
