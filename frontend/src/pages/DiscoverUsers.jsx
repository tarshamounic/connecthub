import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import PageHeader from '../components/PageHeader';
import UserCard from '../components/UserCard';
import { useSocket } from '../context/SocketContext';
import useDebounce from '../hooks/useDebounce';
import { getApiError, requestApi, userApi } from '../services/api';

const FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'LIVE', label: 'LIVE' },
];

export default function DiscoverUsers() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filter, setFilter] = useState('ALL');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestingId, setRequestingId] = useState(null);
  const { notify } = useSocket();
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setSearch(searchParams.get('q') || '');
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.list({ search: debouncedSearch, filter });
      setUsers(data);
      setError('');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRequest = async (candidate) => {
    setRequestingId(candidate.id);
    try {
      await requestApi.send(candidate.id);
      setUsers((previous) =>
        previous.map((member) =>
          member.id === candidate.id
            ? { ...member, relation: { status: 'PENDING_SENT', requestId: null, conversationId: null } }
            : member,
        ),
      );
      notify(`Chat request sent to ${candidate.fullName}`, 'success');
    } catch (err) {
      notify(getApiError(err), 'error');
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Community"
        title="Discover members"
        subtitle="Find classmates and teammates, then send a chat request to start a private conversation."
      />

      <div className="card toolbar">
        <div className="search-input">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or username"
            aria-label="Search members"
          />
        </div>
        <div className="segmented" role="tablist" aria-label="Filter members">
          {FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={filter === option.value}
              className={`segmented-item ${filter === option.value ? 'active' : ''}`.trim()}
              onClick={() => setFilter(option.value)}
            >
              {option.value === 'LIVE' ? <span className="live-dot" /> : null}
              {option.label}
            </button>
          ))}
        </div>
        <span className="toolbar-count">{users.length} members</span>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <Loading label="Finding members…" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Try a different search term or filter."
        />
      ) : (
        <div className="user-grid">
          {users.map((candidate) => (
            <UserCard
              key={candidate.id}
              candidate={candidate}
              onRequest={handleRequest}
              requesting={requestingId === candidate.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
