'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Flex, Text, HStack, Grid, VStack,
  Badge, Separator, Spinner, Input, Textarea,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiSend, FiRefreshCw } from 'react-icons/fi';
import { ICON_MAP } from '../../chanda/_iconMap';

const ICON_OPTIONS = Object.keys(ICON_MAP);

// ── tiny helpers ───────────────────────────────────────────────────────────────

function Btn({ onClick, disabled, loading, children, variant = 'primary', size = 'md', ...rest }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    borderRadius: '10px', fontWeight: 700, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1, transition: 'opacity 0.15s',
    fontSize: size === 'sm' ? '12px' : '14px',
    padding: size === 'sm' ? '6px 12px' : '10px 18px',
    border: 'none',
  };
  const styles = {
    primary: { background: 'linear-gradient(to right, #6366f1, #8b5cf6)', color: 'white' },
    danger:  { background: '#ef444415', color: '#ef4444', border: '1.5px solid #ef444430' },
    ghost:   { background: 'transparent', color: '#6366f1', border: '1.5px solid #6366f130' },
    gold:    { background: 'linear-gradient(135deg, #b8952f, #e8c97e)', color: '#1a0f00' },
  };
  return (
    <Box as="button" onClick={disabled || loading ? undefined : onClick} style={{ ...base, ...styles[variant] }} {...rest}>
      {loading ? <Spinner size="xs" /> : children}
    </Box>
  );
}

function Field({ label, children }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="700" color={{ base: 'gray.500', _dark: 'gray.400' }} mb={1} textTransform="uppercase" letterSpacing="wider">
        {label}
      </Text>
      {children}
    </Box>
  );
}

function StyledInput({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <Input
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
      size="sm" borderRadius="lg"
      bg={{ base: 'gray.50', _dark: '#1f2937' }}
      border="1.5px solid"
      borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.150' }}
      color={{ base: 'gray.800', _dark: 'white' }}
      _placeholder={{ color: { base: 'gray.400', _dark: 'gray.600' } }}
      _focus={{ borderColor: '#6366f1', boxShadow: '0 0 0 1px #6366f120' }}
      {...rest}
    />
  );
}

function Card({ children, ...rest }) {
  return (
    <Box
      bg={{ base: 'white', _dark: '#111827' }}
      border="1px solid"
      borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
      borderRadius="2xl"
      p={6}
      {...rest}
    >
      {children}
    </Box>
  );
}

function SectionTitle({ children }) {
  return (
    <Text fontSize="lg" fontWeight="800" color={{ base: 'gray.800', _dark: 'white' }} mb={5}>
      {children}
    </Text>
  );
}

// ── Goals section ──────────────────────────────────────────────────────────────

const EMPTY_GOAL = { id: '', label: '', title: '', description: '', target: '', color: '#6366f1', gradient: '', icon: 'globe' };

function GoalRow({ goal, onSave, onDelete, saving, deleting }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState(goal);
  const Icon = ICON_MAP[goal.icon] ?? ICON_MAP.globe;

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const cancel = () => { setForm(goal); setEditing(false); };
  const save   = () => { onSave({ ...form, target: Number(form.target) }); setEditing(false); };

  if (!editing) {
    return (
      <HStack
        bg={{ base: 'gray.50', _dark: '#1a2332' }} borderRadius="xl" p={4} gap={4}
        border="1px solid" borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.80' }}
      >
        <Flex w="36px" h="36px" borderRadius="10px" align="center" justify="center" flexShrink={0}
          bg={`${goal.color}15`} border="1px solid" borderColor={`${goal.color}25`}>
          <Icon size={16} color={goal.color} />
        </Flex>
        <Box flex={1} minW={0}>
          <HStack gap={2} mb={0.5}>
            <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.800', _dark: 'white' }}>{goal.label}</Text>
            <Badge fontSize="10px" px={1.5} py={0} borderRadius="full" bg={`${goal.color}15`} color={goal.color}>{goal.id}</Badge>
          </HStack>
          <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.500' }} isTruncated>{goal.description}</Text>
        </Box>
        <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.300' }} flexShrink={0}>
          ₹{Number(goal.target).toLocaleString('en-IN')}/yr
        </Text>
        <HStack gap={2} flexShrink={0}>
          <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}><FiEdit2 size={13} /> Edit</Btn>
          <Btn variant="danger" size="sm" onClick={onDelete} loading={deleting}><FiTrash2 size={13} /></Btn>
        </HStack>
      </HStack>
    );
  }

  return (
    <Box bg={{ base: 'gray.50', _dark: '#1a2332' }} borderRadius="xl" p={4}
      border="1.5px solid #6366f140">
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3} mb={3}>
        <Field label="Label"><StyledInput value={form.label} onChange={v => upd('label', v)} placeholder="Web Domain" /></Field>
        <Field label="Title"><StyledInput value={form.title} onChange={v => upd('title', v)} placeholder="indianvirtual.site" /></Field>
        <Field label="Target (₹/yr)"><StyledInput value={form.target} onChange={v => upd('target', v)} type="number" placeholder="3600" /></Field>
        <Field label="Color">
          <HStack gap={2}>
            <Box as="input" type="color" value={form.color} onChange={e => upd('color', e.target.value)}
              style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 0 }} />
            <StyledInput value={form.color} onChange={v => upd('color', v)} placeholder="#6366f1" />
          </HStack>
        </Field>
        <Field label="Icon">
          <Box as="select" value={form.icon} onChange={e => upd('icon', e.target.value)}
            style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 13, border: '1.5px solid', cursor: 'pointer' }}
            bg={{ base: 'gray.50', _dark: '#1f2937' }}
            color={{ base: 'gray.800', _dark: 'white' }}>
            {ICON_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </Box>
        </Field>
        <Field label="Gradient CSS">
          <StyledInput value={form.gradient} onChange={v => upd('gradient', v)} placeholder="linear-gradient(to right, #6366f1, #8b5cf6)" />
        </Field>
      </Grid>
      <Field label="Description">
        <Textarea value={form.description} onChange={e => upd('description', e.target.value)}
          size="sm" borderRadius="lg" rows={2}
          bg={{ base: 'gray.50', _dark: '#1f2937' }}
          border="1.5px solid" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.150' }}
          color={{ base: 'gray.800', _dark: 'white' }}
          _focus={{ borderColor: '#6366f1' }}
          placeholder="Short description for pilots..."
        />
      </Field>
      <HStack mt={3} justify="flex-end" gap={2}>
        <Btn variant="ghost" size="sm" onClick={cancel}><FiX size={13} /> Cancel</Btn>
        <Btn variant="primary" size="sm" onClick={save} loading={saving}><FiCheck size={13} /> Save</Btn>
      </HStack>
    </Box>
  );
}

function GoalsSection({ goals, onGoalsChange, showToast }) {
  const [saving, setSaving]   = useState(false);
  const [adding, setAdding]   = useState(false);
  const [newGoal, setNewGoal] = useState(EMPTY_GOAL);

  const upd = (k, v) => setNewGoal(f => ({ ...f, [k]: v }));

  const saveGoals = async (updatedGoals) => {
    setSaving(true);
    try {
      const res = await fetch('/api/chanda/goals', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGoals),
      });
      if (res.ok) { onGoalsChange(updatedGoals); showToast('Goals saved.'); }
      else showToast('Failed to save goals.', false);
    } catch { showToast('Network error.', false); }
    setSaving(false);
  };

  const handleSaveGoal = (updated) => {
    saveGoals(goals.map(g => g.id === updated.id ? updated : g));
  };

  const handleDelete = (id) => {
    saveGoals(goals.filter(g => g.id !== id));
  };

  const handleAdd = () => {
    if (!newGoal.id || !newGoal.label || !newGoal.target) return;
    if (goals.some(g => g.id === newGoal.id)) { showToast('Goal ID already exists.', false); return; }
    const gradient = newGoal.gradient || `linear-gradient(to right, ${newGoal.color}, ${newGoal.color}99)`;
    saveGoals([...goals, { ...newGoal, target: Number(newGoal.target), gradient }]);
    setNewGoal(EMPTY_GOAL);
    setAdding(false);
  };

  return (
    <Card>
      <Flex justify="space-between" align="center" mb={5}>
        <SectionTitle>Goals</SectionTitle>
        <Btn variant="primary" size="sm" onClick={() => setAdding(a => !a)}>
          <FiPlus size={13} /> Add Goal
        </Btn>
      </Flex>

      <VStack gap={3} align="stretch">
        {goals.map(g => (
          <GoalRow key={g.id} goal={g}
            onSave={handleSaveGoal}
            onDelete={() => handleDelete(g.id)}
            saving={saving} deleting={saving}
          />
        ))}
      </VStack>

      {adding && (
        <Box mt={4} bg={{ base: 'gray.50', _dark: '#1a2332' }} borderRadius="xl" p={4}
          border="1.5px dashed" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.150' }}>
          <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.300' }} mb={3}>New Goal</Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3} mb={3}>
            <Field label="ID (unique)"><StyledInput value={newGoal.id} onChange={v => upd('id', v)} placeholder="hosting" /></Field>
            <Field label="Label"><StyledInput value={newGoal.label} onChange={v => upd('label', v)} placeholder="Cloud Platform" /></Field>
            <Field label="Title"><StyledInput value={newGoal.title} onChange={v => upd('title', v)} placeholder="Vercel Pro" /></Field>
            <Field label="Target (₹/yr)"><StyledInput value={newGoal.target} onChange={v => upd('target', v)} type="number" placeholder="20000" /></Field>
            <Field label="Color">
              <HStack gap={2}>
                <Box as="input" type="color" value={newGoal.color} onChange={e => upd('color', e.target.value)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', padding: 0 }} />
                <StyledInput value={newGoal.color} onChange={v => upd('color', v)} placeholder="#f59e0b" />
              </HStack>
            </Field>
            <Field label="Icon">
              <Box as="select" value={newGoal.icon} onChange={e => upd('icon', e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 8, fontSize: 13, border: '1.5px solid', cursor: 'pointer' }}>
                {ICON_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </Box>
            </Field>
          </Grid>
          <Field label="Description">
            <Textarea value={newGoal.description} onChange={e => upd('description', e.target.value)}
              size="sm" borderRadius="lg" rows={2}
              bg={{ base: 'gray.50', _dark: '#1f2937' }}
              border="1.5px solid" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.150' }}
              color={{ base: 'gray.800', _dark: 'white' }}
              _focus={{ borderColor: '#6366f1' }}
              placeholder="Short description..."
            />
          </Field>
          <HStack mt={3} justify="flex-end" gap={2}>
            <Btn variant="ghost" size="sm" onClick={() => setAdding(false)}><FiX size={13} /> Cancel</Btn>
            <Btn variant="primary" size="sm" onClick={handleAdd} loading={saving}
              disabled={!newGoal.id || !newGoal.label || !newGoal.target}>
              <FiCheck size={13} /> Add
            </Btn>
          </HStack>
        </Box>
      )}
    </Card>
  );
}

// ── Manual Contribution section ───────────────────────────────────────────────

function ManualContributeSection({ goals, showToast }) {
  const [form, setForm]       = useState({ ifcName: '', goalId: 'all', amount: '', discordId: '' });
  const [submitting, setSub]  = useState(false);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.ifcName || !form.amount || Number(form.amount) < 1) {
      showToast('Fill in IFC name and amount.', false); return;
    }
    setSub(true);
    try {
      const res = await fetch('/api/chanda/admin/contribute', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ifcName: form.ifcName, goalId: form.goalId, amountRupees: Number(form.amount), discordId: form.discordId || null }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Contribution recorded for ${form.ifcName} (${data.paymentId})`);
        setForm({ ifcName: '', goalId: 'all', amount: '', discordId: '' });
      } else {
        showToast(data.error || 'Failed to record contribution.', false);
      }
    } catch { showToast('Network error.', false); }
    setSub(false);
  };

  const goalOptions = [{ id: 'all', label: 'All Goals (split equally)' }, ...goals];

  return (
    <Card>
      <SectionTitle>Manual Contribution</SectionTitle>
      <Text fontSize="sm" color={{ base: 'gray.500', _dark: 'gray.400' }} mb={5}>
        Record a manual UPI payment. This directly credits the goal and can grant the supporter role when a Discord ID is provided.
      </Text>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
        <Field label="IFC Name *">
          <StyledInput value={form.ifcName} onChange={v => upd('ifcName', v)} placeholder="Pilot IFC username" />
        </Field>
        <Field label="Goal *">
          <Box as="select" value={form.goalId} onChange={e => upd('goalId', e.target.value)}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 13, border: '1.5px solid', cursor: 'pointer' }}>
            {goalOptions.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </Box>
        </Field>
        <Field label="Amount (₹) *">
          <StyledInput value={form.amount} onChange={v => upd('amount', v)} type="number" placeholder="500" />
        </Field>
        <Field label="Discord ID (optional)">
          <StyledInput value={form.discordId} onChange={v => upd('discordId', v)} placeholder="123456789012345678" />
        </Field>
      </Grid>

      <HStack mt={5} justify="flex-end">
        <Btn variant="primary" onClick={submit} loading={submitting}
          disabled={!form.ifcName || !form.amount}>
          <FiSend size={13} /> Record Contribution
        </Btn>
      </HStack>
    </Card>
  );
}

// ── Lotus Privé section ────────────────────────────────────────────────────────

function LotusAdminSection({ showToast, subscribers }) {
  const [form, setForm]     = useState({ price: '190', roleId: '' });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setRes] = useState(false);

  useEffect(() => {
    fetch('/api/chanda/lotus/settings')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setForm({ price: String(Math.round((d.price || 19000) / 100)), roleId: d.roleId || '' }); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const upd  = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/chanda/lotus/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: Math.round(Number(form.price) * 100), roleId: form.roleId }),
      });
      if (res.ok) showToast('Lotus settings saved. New manual confirmations will use the updated settings.');
      else showToast('Failed to save.', false);
    } catch { showToast('Network error.', false); }
    setSaving(false);
  };

  const resetPlan = async () => {
    if (!confirm('This clears the legacy gateway plan ID. Manual UPI payments are not affected. Continue?')) return;
    setRes(true);
    try {
      const res = await fetch('/api/chanda/lotus/settings', {
        method: 'DELETE',
      });
      if (res.ok) showToast('Legacy plan ID cleared.');
      else showToast('Failed.', false);
    } catch { showToast('Network error.', false); }
    setRes(false);
  };

  return (
    <Card style={{ background: 'linear-gradient(135deg, #070910 0%, #0d0a1a 100%)', border: '1px solid rgba(201,169,110,0.22)' }}>
      <Flex justify="space-between" align="flex-start" mb={5}>
        <Box>
          <Text fontSize="lg" fontWeight="800" mb={1}
            style={{ background: 'linear-gradient(135deg, #e8c97e, #c9a96e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Lotus Privé Settings
          </Text>
          <HStack gap={2}>
            <Box style={{ width: 6, height: 6, borderRadius: '50%', background: '#c9a96e' }} />
            <Text fontSize="sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {subscribers} active member{subscribers === 1 ? '' : 's'}
            </Text>
          </HStack>
        </Box>
        <Badge px={2.5} py={1} borderRadius="full" fontSize="10px" fontWeight="700" letterSpacing="wide"
          style={{ background: 'rgba(201,169,110,0.12)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.28)' }}>
          Monthly
        </Badge>
      </Flex>

      {!loaded ? (
        <Flex justify="center" py={6}><Spinner size="sm" style={{ color: '#c9a96e' }} /></Flex>
      ) : (
        <>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4} mb={5}>
            <Field label="Price per cycle (₹)">
              <Input
                value={form.price} onChange={e => upd('price', e.target.value)} type="number" size="sm"
                borderRadius="lg" placeholder="190"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(201,169,110,0.25)', color: 'rgba(255,255,255,0.8)', borderRadius: 8 }}
              />
              <Text fontSize="11px" mt={1} style={{ color: 'rgba(255,255,255,0.3)' }}>
                Monthly pledge amount shown to Lotus Privé members.
              </Text>
            </Field>
            <Field label="Lotus Privé Discord Role ID">
              <Input
                value={form.roleId} onChange={e => upd('roleId', e.target.value)} size="sm"
                borderRadius="lg" placeholder="Leave empty to skip"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(201,169,110,0.25)', color: 'rgba(255,255,255,0.8)', borderRadius: 8 }}
              />
              <Text fontSize="11px" mt={1} style={{ color: 'rgba(255,255,255,0.3)' }}>
                Granted after trusted UPI confirmation and revoked when the monthly pledge lapses.
              </Text>
            </Field>
          </Grid>

          <HStack justify="flex-end" gap={3}>
            <Btn variant="ghost" size="sm" onClick={resetPlan} loading={resetting}
              style={{ color: 'rgba(201,169,110,0.6)', border: '1.5px solid rgba(201,169,110,0.2)', background: 'transparent' }}>
              <FiRefreshCw size={12} /> Clear Legacy Plan
            </Btn>
            <Btn onClick={save} loading={saving} style={{ background: 'linear-gradient(135deg, #b8952f, #e8c97e)', color: '#1a0f00', padding: '8px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none' }}>
              <FiCheck size={13} /> Save Settings
            </Btn>
          </HStack>
        </>
      )}
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ChandaAdminPage() {
  const [goals, setGoals]   = useState([]);
  const [stats, setStats]   = useState({ contributors: 0, lotus: { subscribers: 0 } });
  const [loading, setLoad]  = useState(true);
  const [toast, setToast]   = useState(null);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/chanda/stats').then(r => r.json()),
    ]).then(([s]) => {
      setStats(s);
      setGoals(s.goalDefs ?? []);
    }).catch(() => {}).finally(() => setLoad(false));
  }, []);

  return (
    <Box maxW="960px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>

      {toast && (
        <Box position="fixed" bottom="24px" right="24px" zIndex={9998}
          bg={toast.ok ? '#10b981' : '#ef4444'} color="white"
          px={5} py={3} borderRadius="xl" fontSize="sm" fontWeight="600"
          boxShadow="0 8px 30px rgba(0,0,0,0.25)" maxW="380px">
          {toast.msg}
        </Box>
      )}

      {/* Header */}
      <Flex justify="space-between" align="flex-start" mb={8}>
        <Box>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800" color={{ base: 'gray.900', _dark: 'white' }} mb={1}>
            Contributions Admin
          </Text>
          <Text fontSize="sm" color={{ base: 'gray.500', _dark: 'gray.400' }}>
            Manage funding goals, record manual payments, and configure Lotus Privé.
          </Text>
        </Box>
        <HStack gap={3}>
          <Box textAlign="center">
            <Text fontWeight="800" fontSize="xl" color={{ base: 'gray.900', _dark: 'white' }}>{stats.contributors}</Text>
            <Text fontSize="10px" color={{ base: 'gray.500', _dark: 'gray.500' }} textTransform="uppercase" letterSpacing="wider">Contributors</Text>
          </Box>
          <Separator orientation="vertical" h="40px" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.150' }} />
          <Box textAlign="center">
            <Text fontWeight="800" fontSize="xl" style={{ background: 'linear-gradient(135deg, #e8c97e, #c9a96e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {stats.lotus?.subscribers ?? 0}
            </Text>
            <Text fontSize="10px" color={{ base: 'gray.500', _dark: 'gray.500' }} textTransform="uppercase" letterSpacing="wider">Lotus Members</Text>
          </Box>
        </HStack>
      </Flex>

      {loading ? (
        <Flex justify="center" py={20}><Spinner color="#6366f1" /></Flex>
      ) : (
        <VStack gap={6} align="stretch">
          <GoalsSection goals={goals} onGoalsChange={setGoals} showToast={showToast} />
          <ManualContributeSection goals={goals} showToast={showToast} />
          <LotusAdminSection showToast={showToast} subscribers={stats.lotus?.subscribers ?? 0} />
        </VStack>
      )}
    </Box>
  );
}
