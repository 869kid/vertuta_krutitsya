import { useCallback, useRef, useState } from 'react';
import { Combobox, InputBase, Text, useCombobox, type MantineSize } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

import { useAuthorHistory } from '@shared/lib/useAuthorHistory';

interface AuthorSelectProps {
  value: string;
  onChange: (value: string) => void;
  size?: MantineSize;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  className?: string;
  label?: string;
}

const AuthorSelect = ({ value, onChange, size = 'sm', placeholder, onKeyDown, className, label }: AuthorSelectProps) => {
  const { t } = useTranslation();
  const { allAuthors, addAuthor } = useAuthorHistory();
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const createInputRef = useRef<HTMLInputElement>(null);

  const combobox = useCombobox({
    onDropdownClose: () => {
      combobox.resetSelectedOption();
      setSearch('');
      setIsCreating(false);
    },
  });

  const filteredOptions = search.trim()
    ? allAuthors.filter((a) => a.toLowerCase().includes(search.toLowerCase().trim()))
    : allAuthors;

  const handleOptionSubmit = useCallback(
    (val: string) => {
      if (val === '__create__') {
        setIsCreating(true);
        setTimeout(() => createInputRef.current?.focus(), 0);
        return;
      }
      onChange(val);
      combobox.closeDropdown();
    },
    [onChange, combobox],
  );

  const handleCreateConfirm = useCallback(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }
    addAuthor(trimmed);
    onChange(trimmed);
    setSearch('');
    setIsCreating(false);
    combobox.closeDropdown();
  }, [search, addAuthor, onChange, combobox]);

  const handleCreateKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCreateConfirm();
      }
      if (e.key === 'Escape') {
        setIsCreating(false);
      }
    },
    [handleCreateConfirm],
  );

  const resolvedPlaceholder = placeholder ?? t('wheel.authorSelectPlaceholder', 'Author...');

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
      <Combobox.Target>
        <InputBase
          component='button'
          type='button'
          pointer
          label={label}
          rightSection={<Combobox.Chevron />}
          rightSectionPointerEvents='none'
          onClick={() => combobox.toggleDropdown()}
          onKeyDown={onKeyDown}
          size={size}
          className={className}
        >
          {value || <Text c='dimmed' size={size} span>{resolvedPlaceholder}</Text>}
        </InputBase>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Search
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder={t('wheel.authorSearchPlaceholder', 'Search...')}
          size={size}
        />
        <Combobox.Options>
          {filteredOptions.map((author) => (
            <Combobox.Option value={author} key={author} active={author === value}>
              {author}
            </Combobox.Option>
          ))}
          {filteredOptions.length === 0 && !isCreating && (
            <Combobox.Empty>{t('wheel.noAuthorsFound', 'No matches')}</Combobox.Empty>
          )}
        </Combobox.Options>

        <Combobox.Footer>
          {isCreating ? (
            <InputBase
              ref={createInputRef}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={handleCreateConfirm}
              placeholder={t('wheel.newAuthorPlaceholder', 'Name...')}
              size={size}
            />
          ) : (
            <Combobox.Option value='__create__'>
              <Text size={size} c='dimmed' style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconPlus size={14} />
                {t('wheel.addAuthor', 'Add author')}
              </Text>
            </Combobox.Option>
          )}
        </Combobox.Footer>
      </Combobox.Dropdown>
    </Combobox>
  );
};

export default AuthorSelect;
