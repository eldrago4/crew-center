'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import {
  Box, Flex, Text, HStack, Grid,
  Badge, Separator, Spinner, Input,
} from '@chakra-ui/react';
import { FiHeart, FiUsers, FiZap, FiClock } from 'react-icons/fi';
import { ICON_MAP } from './_iconMap';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

const AMOUNTS = [ 100, 250, 500, 1000 ];
const ALL_GRADIENT = 'linear-gradient(to right, #6366f1, #0ea5e9, #f59e0b, #10b981)';
const LOTUS_PRICE = 190;
const UPI_PAYEE = 'tred38434-1@okhdfcbank';
const UPI_NAME = 'Ved B';
const UPI_AID = 'uGICAgIDjpaH5Aw';

function buildUpiLink(amount, note) {
  const params = new URLSearchParams({
    pa: UPI_PAYEE,
    pn: UPI_NAME,
    am: Number(amount || 0).toFixed(2),
    cu: 'INR',
    aid: UPI_AID,
  });
  if (note) params.set('tn', note);
  return `upi://pay?${params.toString()}`;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function WavyUnderline({ color = '#f59e0b' }) {
  return (
    <Box as="span" position="absolute" bottom="-6px" left={0} right={0} overflow="hidden" lineHeight={0} pointerEvents="none">
      <svg viewBox="0 0 200 8" preserveAspectRatio="none" height="8" style={{ display: 'block', width: '100%' }}>
        <path
          d="M0,4 C12,0 24,8 36,4 C48,0 60,8 72,4 C84,0 96,8 108,4 C120,0 132,8 144,4 C156,0 168,8 180,4 C192,0 200,5 200,4"
          stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"
        />
      </svg>
    </Box>
  );
}

function AmountPicker({ color, gradient, selected, custom, onSelect, onCustom, onContribute, loading, label }) {
  return (
    <>
      <Grid templateColumns="repeat(4, 1fr)" gap={2} mb={3}>
        {AMOUNTS.map(amt => (
          <Box
            key={amt} as="button" py={2} borderRadius="lg" fontSize="sm" fontWeight="600"
            border="1.5px solid"
            borderColor={selected === amt ? color : { base: 'gray.200', _dark: 'whiteAlpha.150' }}
            bg={selected === amt ? `${color}15` : 'transparent'}
            color={selected === amt ? color : { base: 'gray.600', _dark: 'gray.400' }}
            transition="all 0.15s" cursor="pointer"
            _hover={{ borderColor: color, color }}
            onClick={() => onSelect(amt)}
          >
            ₹{amt}
          </Box>
        ))}
      </Grid>

      <Box mb={4}>
        <Box
          w="100%" py={2} px={4} borderRadius="lg" border="1.5px solid"
          borderColor={selected === 'custom' ? color : { base: 'gray.200', _dark: 'whiteAlpha.150' }}
          bg={selected === 'custom' ? `${color}10` : 'transparent'}
          onClick={() => onSelect('custom')} display="block" cursor="pointer" textAlign="left" role="button" tabIndex={0}
          _hover={{ borderColor: color }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect('custom'); } }}
        >
          {selected === 'custom' ? (
            <Flex align="center" gap={2}>
              <Text color={{ base: 'gray.700', _dark: 'gray.400' }} fontSize="sm" flexShrink={0}>₹</Text>
              <Input
                autoFocus variant="unstyled" type="number" min={1} placeholder="Enter amount"
                value={custom} onChange={e => onCustom(e.target.value)} onClick={e => e.stopPropagation()}
                color={{ base: 'gray.800', _dark: 'white' }}
                _placeholder={{ color: { base: 'gray.400', _dark: 'gray.600' } }}
                fontSize="sm" fontWeight="600" flex={1}
              />
            </Flex>
          ) : (
            <Text fontSize="sm" color={{ base: 'gray.600', _dark: 'gray.500' }}>Custom amount…</Text>
          )}
        </Box>
      </Box>

      <Box
        as="button" w="100%" py="12px" borderRadius="xl" fontSize="sm" fontWeight="700"
        style={selected ? { background: gradient, color: '#fff', border: 'none' } : {}}
        bg="transparent" border="1.5px solid"
        borderColor={{ base: 'gray.300', _dark: 'whiteAlpha.200' }}
        color={{ base: 'gray.700', _dark: 'gray.400' }}
        cursor={selected ? 'pointer' : 'not-allowed'} transition="opacity 0.2s"
        opacity={loading ? 0.7 : 1} _hover={selected ? { opacity: 0.88 } : {}}
        onClick={selected ? onContribute : undefined}
        letterSpacing="wide" display="flex" alignItems="center" justifyContent="center" gap="8px"
      >
        {loading ? <Spinner size="sm" /> : (
          <>
            <FiHeart size={14} />
            {selected
              ? `${label} ₹${selected === 'custom' ? (custom || '—') : selected.toLocaleString('en-IN')}`
              : 'Select an amount above'}
          </>
        )}
      </Box>
    </>
  );
}

function GoalCard({ goal, raised, onContribute }) {
  const [ selected, setSelected ] = useState(null);
  const [ custom, setCustom ] = useState('');
  const [ loading, setLoading ] = useState(false);

  const pct = Math.min(100, Math.round((raised / goal.target) * 100));
  const Icon = ICON_MAP[ goal.icon ] ?? FiHeart;

  const handleContribute = async () => {
    const amt = selected === 'custom' ? parseFloat(custom) : selected;
    if (!amt || amt < 1) return;
    setLoading(true);
    await onContribute(goal.id, amt);
    setLoading(false);
    setSelected(null);
    setCustom('');
  };

  return (
    <Box bg={{ base: 'white', _dark: '#111827' }} border="1px solid" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} borderRadius="2xl" overflow="hidden">
      <Box h="3px" sx={{ background: goal.gradient }} />
      <Box p={6}>
        <HStack mb={4} gap={3}>
          <Flex w="44px" h="44px" borderRadius="12px" align="center" justify="center" bg={`${goal.color}18`} border="1px solid" borderColor={`${goal.color}30`} flexShrink={0}>
            <Icon size={20} color={goal.color} />
          </Flex>
          <Box flex={1} minW={0}>
            <Text fontSize="xs" fontWeight="600" color={goal.color} textTransform="uppercase" letterSpacing="wider" mb={0.5}>{goal.label}</Text>
            <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.800', _dark: 'white' }}>{goal.title}</Text>
          </Box>
          <Box textAlign="right" flexShrink={0}>
            <Text fontSize="xs" color={{ base: 'gray.700', _dark: 'gray.400' }}>Goal</Text>
            <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.200' }}>
              ₹{goal.target.toLocaleString('en-IN')}
              <Text as="span" fontWeight="400" fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.500' }}>/yr</Text>
            </Text>
          </Box>
        </HStack>

        <Text fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.400' }} lineHeight="1.6" mb={5}>{goal.description}</Text>

        <Box mb={5}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" color={{ base: 'gray.600', _dark: 'gray.500' }}>Raised</Text>
            <HStack gap={1} align="baseline">
              <Text fontSize="sm" fontWeight="700" color={goal.color}>₹{raised.toLocaleString('en-IN')}</Text>
              <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.600' }}>/ ₹{goal.target.toLocaleString('en-IN')}</Text>
            </HStack>
          </HStack>
          <Box h="6px" borderRadius="full" bg={{ base: 'gray.100', _dark: 'whiteAlpha.100' }} overflow="hidden">
            <Box h="100%" borderRadius="full" sx={{ background: goal.gradient }} w={`${pct}%`} transition="width 1s ease" />
          </Box>
          <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.600' }} mt={1.5} textAlign="right">{pct}% funded</Text>
        </Box>

        <AmountPicker
          color={goal.color} gradient={goal.gradient}
          selected={selected} custom={custom}
          onSelect={v => { setSelected(v); setCustom(''); }}
          onCustom={setCustom} onContribute={handleContribute}
          loading={loading} label="Contribute"
        />
      </Box>
    </Box>
  );
}

function SupportAllCard({ goals, goalStats, onContribute }) {
  const [ selected, setSelected ] = useState(null);
  const [ custom, setCustom ] = useState('');
  const [ loading, setLoading ] = useState(false);

  const totalTarget = goals.reduce((a, g) => a + g.target, 0);
  const totalRaised = goals.reduce((a, g) => a + (goalStats[ g.id ] || 0), 0);
  const pct = totalTarget > 0 ? Math.min(100, Math.round((totalRaised / totalTarget) * 100)) : 0;
  const activeGoals = goals.filter(g => (goalStats[ g.id ] || 0) < g.target);
  const splitGoals = activeGoals.length > 0 ? activeGoals : goals;
  const fullyFunded = goals.length - activeGoals.length;

  const handleContribute = async () => {
    const amt = selected === 'custom' ? parseFloat(custom) : selected;
    if (!amt || amt < 1) return;
    setLoading(true);
    await onContribute('all', amt);
    setLoading(false);
    setSelected(null);
    setCustom('');
  };

  return (
    <Box bg={{ base: 'white', _dark: '#111827' }} border="1px solid" borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} borderRadius="2xl" overflow="hidden" mt={5}>
      <Flex h="3px">{goals.map(g => <Box key={g.id} flex={1} sx={{ background: g.gradient }} />)}</Flex>
      <Box p={6}>
        <HStack mb={4} gap={3}>
          <Flex w="44px" h="44px" borderRadius="12px" align="center" justify="center" flexShrink={0}
            sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #0ea5e9 35%, #f59e0b 65%, #10b981 100%)' }}>
            <FiHeart size={20} color="white" />
          </Flex>
          <Box flex={1} minW={0}>
            <Text fontSize="xs" fontWeight="600" color="#6366f1" textTransform="uppercase" letterSpacing="wider" mb={0.5}>General Support</Text>
            <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.800', _dark: 'white' }}>Support All Goals</Text>
          </Box>
        </HStack>

        <Text fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.400' }} lineHeight="1.6" mb={4}>
          Your contribution is divided equally across all active goals. Fully funded goals are skipped.
        </Text>

        <HStack gap={2} mb={5} flexWrap="wrap" align="center">
          {splitGoals.map(g => (
            <Badge key={g.id} px={2.5} py={0.5} borderRadius="full" fontSize="xs" fontWeight="600"
              bg={`${g.color}15`} color={g.color} border="1px solid" borderColor={`${g.color}30`}>
              {g.label}
            </Badge>
          ))}
          {fullyFunded > 0 && (
            <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.600' }}>
              ({fullyFunded} goal{fullyFunded > 1 ? 's' : ''} fully funded ✓)
            </Text>
          )}
        </HStack>

        <Box mb={5}>
          <Box h="6px" borderRadius="full" bg={{ base: 'gray.100', _dark: 'whiteAlpha.100' }} overflow="hidden" mb={2}>
            <Box h="100%" borderRadius="full" w={`${pct}%`} transition="width 1s ease" sx={{ background: ALL_GRADIENT }} />
          </Box>
          <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.600' }} textAlign="right">{pct}% funded overall</Text>
        </Box>

        <AmountPicker
          color="#6366f1" gradient={ALL_GRADIENT}
          selected={selected} custom={custom}
          onSelect={v => { setSelected(v); setCustom(''); }}
          onCustom={setCustom} onContribute={handleContribute}
          loading={loading} label="Support All —"
        />
      </Box>
    </Box>
  );
}

// ── Lotus Privé ────────────────────────────────────────────────────────────────
// Always dark — uses style/sx props only for colors, bypasses Chakra theme vars.

const LOTUS_PERKS = [
  { title: 'Lotus Privé Role', desc: 'Exclusive Discord badge with a unique gold colour' },
  { title: 'Beta Access', desc: 'Try new Crew Center features before anyone else' },
  { title: 'Insider Dispatches', desc: 'Monthly behind-the-scenes from the dev team' },
  { title: 'Priority PIREPs', desc: 'Your reports move to the front of the review queue' },
  { title: 'Supporters Wall', desc: 'Your IFC name permanently in the app credits' },
  { title: 'Private Channel', desc: 'Direct Discord thread with the INVA staff team' },
];

function LotusGlyph({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id="lga" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e8c97e" />
          <stop offset="50%" stopColor="#c9a96e" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <radialGradient id="lgb" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e8c97e" />
        </radialGradient>
      </defs>
      {[ 0, 45, 90, 135, 180, 225, 270, 315 ].map(a => (
        <path key={a} d="M28 8 C23 17 21 23 28 28 C35 23 33 17 28 8Z"
          fill="url(#lga)" opacity="0.82" transform={`rotate(${a} 28 28)`} />
      ))}
      <circle cx="28" cy="28" r="6.5" fill="url(#lga)" />
      <circle cx="28" cy="28" r="3" fill="url(#lgb)" />
    </svg>
  );
}

function LotusPriveSection({ subscribers, members = [], slotsRemaining = 4, onSubscribe }) {
  const [ subLoading, setSubLoading ] = useState(false);
  const [ subDone, setSubDone ] = useState(false);
  const isFull = slotsRemaining <= 0;

  const handleSubscribe = async () => {
    if (subLoading || subDone || isFull) return;
    setSubLoading(true);
    onSubscribe?.({
      amount: LOTUS_PRICE,
      onClose: () => setSubLoading(false),
      onSuccess: () => {
        setSubLoading(false);
        setSubDone(true);
      },
    });
  };
  const cardBg = [
    'radial-gradient(ellipse at 18% 65%, rgba(124,58,237,0.22) 0%, transparent 55%)',
    'radial-gradient(ellipse at 82% 25%, rgba(201,169,110,0.14) 0%, transparent 50%)',
    'radial-gradient(ellipse at 50% 110%, rgba(99,102,241,0.1) 0%, transparent 50%)',
    '#070910',
  ].join(', ');

  return (
    <Box
      position="relative" overflow="hidden" borderRadius="3xl" mt={10}
      style={{
        background: cardBg,
        border: '1px solid rgba(201,169,110,0.22)',
        boxShadow: '0 0 0 1px rgba(201,169,110,0.07), 0 50px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(201,169,110,0.12)',
      }}
    >
      {/* Grid overlay */}
      <Box position="absolute" inset={0} pointerEvents="none" style={{
        backgroundImage: 'linear-gradient(rgba(201,169,110,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(201,169,110,0.035) 1px, transparent 1px)',
        backgroundSize: '44px 44px',
      }} />
      {/* Corner ornaments */}
      <Box position="absolute" top={5} right={7} userSelect="none" aria-hidden
        style={{ opacity: 0.28, color: '#c9a96e', fontSize: '14px', letterSpacing: '0.45em' }}>✦ ✦ ✦</Box>
      <Box position="absolute" bottom={5} left={7} userSelect="none" aria-hidden
        style={{ opacity: 0.18, color: '#c9a96e', fontSize: '12px', letterSpacing: '0.45em' }}>✦ ✦</Box>

      <Box p={{ base: 8, md: 12 }} position="relative">

        {/* Header */}
        <Flex direction="column" align="center" mb={10}>
          <LotusGlyph size={54} />

          <Box mt={5} mb={3} textAlign="center">
            <Box as="span" style={{
              display: 'block', fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 900,
              letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.1,
              background: 'linear-gradient(135deg, #e8c97e 0%, #c9a96e 20%, #f5e5ad 50%, #a78bfa 78%, #e8c97e 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Lotus Privé
            </Box>
          </Box>

          <Box style={{ color: 'rgba(255,255,255,0.62)', fontSize: '14px', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.8 }}>
            A new class of crew membership.<br />Reserved for those who go beyond.
          </Box>

          {/* Subscriber count pill */}
          <Box mt={5} px={4} py={2} borderRadius="full" display="inline-flex" alignItems="center" gap="8px"
            style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.22)' }}>
            <Box style={{ width: 7, height: 7, borderRadius: '50%', background: 'linear-gradient(135deg, #c9a96e, #a78bfa)', flexShrink: 0 }} />
            <Box as="span" style={{ color: '#c9a96e', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em' }}>
              {subscribers > 0
                ? `${subscribers}/4 member${subscribers === 1 ? '' : 's'}`
                : '4 seats available'}
            </Box>
          </Box>
        </Flex>

        {/* Divider */}
        <Box w="100px" h="1px" mx="auto" mb={10}
          style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.55), transparent)' }} />

        {/* Perks grid */}
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3} mb={10}>
          {LOTUS_PERKS.map(perk => (
            <Box key={perk.title} p={4} borderRadius="xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,169,110,0.1)', transition: 'background 0.2s, border-color 0.2s' }}>
              <Box mb={2.5} style={{ color: '#c9a96e', fontSize: '11px', letterSpacing: '0.1em' }}>✦</Box>
              <Box mb={1.5} style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '14px' }}>{perk.title}</Box>
              <Box style={{ color: 'rgba(255,255,255,0.58)', fontSize: '12px', lineHeight: 1.7 }}>{perk.desc}</Box>
            </Box>
          ))}
        </Grid>

        {/* Divider */}
        <Box w="100px" h="1px" mx="auto" mb={10}
          style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.4), transparent)' }} />

        {/* Inner Circle — member showcase */}
        <Box mb={10}>
          <Box mb={5} textAlign="center"
            style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
            Inner Circle
          </Box>

          {members.length === 0 ? (
            <Flex direction="column" align="center" gap={4}>
              {/* Stacked placeholder avatar slots */}
              <Flex justify="center" align="center">
                {[ 0, 1, 2, 3, 4 ].map(i => (
                  <Box key={i} w="52px" h="52px" borderRadius="full" display="flex" alignItems="center" justifyContent="center"
                    style={{
                      marginLeft: i > 0 ? '-16px' : 0,
                      position: 'relative',
                      zIndex: 10 - i,
                      background: 'linear-gradient(135deg, rgba(201,169,110,0.1), rgba(124,58,237,0.08))',
                      border: '2px solid rgba(201,169,110,0.2)',
                      backdropFilter: 'blur(4px)',
                    }}>
                    <Box style={{ color: 'rgba(201,169,110,0.45)', fontSize: '15px' }}>✦</Box>
                  </Box>
                ))}
              </Flex>
              <Box style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.7 }}>
                Opening soon · The first members will appear here
              </Box>
            </Flex>
          ) : (
            <Grid templateColumns={{ base: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }} gap={3}>
              {members.map((m, i) => (
                <Flex key={i} direction="column" align="center" p={3} borderRadius="xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(201,169,110,0.1)' }}>
                  <Box w="44px" h="44px" borderRadius="full" mb={2} overflow="hidden" flexShrink={0}
                    style={{ border: '2px solid rgba(201,169,110,0.4)', flexShrink: 0 }}>
                    {m.avatarUrl ? (
                      <Box as="img" src={m.avatarUrl} alt={m.ifcName} w="100%" h="100%" style={{ objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <Flex w="100%" h="100%" align="center" justify="center"
                        style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.22), rgba(124,58,237,0.18))' }}>
                        <Box style={{ color: '#e8c97e', fontSize: '18px', fontWeight: 900, lineHeight: 1 }}>
                          {(m.ifcName || '?')[ 0 ].toUpperCase()}
                        </Box>
                      </Flex>
                    )}
                  </Box>
                  <Box style={{ color: 'rgba(255,255,255,0.78)', fontSize: '11px', fontWeight: 700, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.ifcName || 'Pilot'}
                  </Box>
                </Flex>
              ))}
            </Grid>
          )}
        </Box>

        {/* Divider */}
        <Box w="100px" h="1px" mx="auto" mb={10}
          style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.35), transparent)' }} />

        {/* Pricing */}
        <Flex direction="column" align="center" mb={8}>
          <Box mb={3} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Membership
          </Box>
          <Box textAlign="center">
            <Box as="span" style={{
              fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #e8c97e, #c9a96e)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              ₹{LOTUS_PRICE}
            </Box>
            <Box as="span" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', marginLeft: '6px' }}>
              / month
            </Box>
          </Box>
          <Box mt={1.5} style={{ color: 'rgba(255,255,255,0.42)', fontSize: '12px' }}>
            Manual monthly pledge · 4 seats only
          </Box>
        </Flex>

        {/* Divider */}
        <Box w="100px" h="1px" mx="auto" mb={8}
          style={{ background: 'linear-gradient(to right, transparent, rgba(201,169,110,0.3), transparent)' }} />

        {/* Subscribe CTA */}
        <Flex direction="column" align="center" gap={4}>
          <Box
            as="button"
            display="inline-flex" alignItems="center" gap="10px" px={10} py={4} borderRadius="2xl"
            onClick={handleSubscribe}
            disabled={subLoading || subDone || isFull}
            style={{
              background: subDone
                ? 'rgba(201,169,110,0.18)'
                : 'linear-gradient(135deg, #b8952f, #e8c97e, #c9a96e)',
              color: subDone ? '#c9a96e' : '#1a0f00',
              border: subDone ? '1px solid rgba(201,169,110,0.4)' : 'none',
              fontWeight: 800, fontSize: '15px', letterSpacing: '0.06em',
              cursor: subLoading || subDone || isFull ? 'default' : 'pointer',
              opacity: subLoading ? 0.75 : 1,
              boxShadow: subDone ? 'none' : '0 8px 32px rgba(201,169,110,0.25)',
              transition: 'all 0.2s ease',
            }}>
            {subDone ? (
              <>✦ Membership Active</>
            ) : isFull ? (
              <>Lotus Privé Full</>
            ) : subLoading ? (
              <>
                <Spinner size="sm" color="blackAlpha.700" />
                Preparing…
              </>
            ) : (
              <>
                <LotusGlyph size={18} />
                Join Lotus Privé
              </>
            )}
          </Box>
          <HStack gap={2} align="center">
            <Box style={{ color: 'rgba(201,169,110,0.4)', fontSize: '10px' }}>✦</Box>
            <Box style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em' }}>
              Pay by UPI · Confirmed on trust
            </Box>
            <Box style={{ color: 'rgba(201,169,110,0.4)', fontSize: '10px' }}>✦</Box>
          </HStack>
        </Flex>

      </Box>
    </Box>
  );
}

// ── Thank You overlay ──────────────────────────────────────────────────────────

function ThankYouOverlay({ goalLabel, amount, callsign, onClose }) {
  const [ windowSize, setWindowSize ] = useState({ width: 0, height: 0 });
  useEffect(() => {
    try {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    } catch (err) {
      // ignore sizing errors
    }
  }, []);

  return (
    <Box position="fixed" inset={0} zIndex={9999} display="flex" alignItems="center" justifyContent="center"
      bg="blackAlpha.700" backdropFilter="blur(6px)" onClick={onClose}>
      {windowSize.width > 0 && windowSize.height > 0 && (
        <Confetti width={windowSize.width} height={windowSize.height} numberOfPieces={300} recycle={false}
          colors={[ '#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa' ]} />
      )}
      <Box bg={{ base: 'white', _dark: '#111827' }} borderRadius="3xl" p={{ base: 8, md: 12 }} maxW="480px" w="90%"
        textAlign="center" boxShadow="0 40px 80px rgba(0,0,0,0.4)" border="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }} onClick={e => e.stopPropagation()}>
        <Text fontSize="4xl" mb={4}>🛫</Text>
        <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="800" color={{ base: 'gray.900', _dark: 'white' }} lineHeight="1.3" mb={3}>
          You just kept INVA flying,<br />
          <Text as="span" sx={{ background: 'linear-gradient(to right, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {callsign}
          </Text>
        </Text>
        <Text fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.400' }} mb={2} lineHeight="1.7">
          Your ₹{amount?.toLocaleString('en-IN')} contribution toward <strong>{goalLabel}</strong> means every pilot here gets to keep filing PIREPs, checking routes, and flying together.
        </Text>
        <Text fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.400' }} mb={6} lineHeight="1.7">
          You've been awarded the <Text as="span" color="#6366f1" fontWeight="700">Supporter</Text> role on Discord. Thank you for being part of what makes this community real. ❤️
        </Text>
        <Box as="button" w="100%" py="12px" borderRadius="xl" fontSize="sm" fontWeight="700"
          sx={{ background: 'linear-gradient(to right, #6366f1, #0ea5e9)' }} color="white" cursor="pointer" onClick={onClose}>
          Back to Contributions
        </Box>
      </Box>
    </Box>
  );
}

function UpiPaymentModal({ intent, onClose, onConfirm }) {
  const [ confirming, setConfirming ] = useState(false);
  if (!intent) return null;

  const upiLink = buildUpiLink(intent.amount, intent.note);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiLink)}`;

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    await onConfirm(intent);
    setConfirming(false);
  };

  return (
    <Box position="fixed" inset={0} zIndex={9999} bg="blackAlpha.700" backdropFilter="blur(8px)"
      display="flex" alignItems="center" justifyContent="center" px={4}>
      <Box bg={{ base: 'white', _dark: '#0f172a' }} borderRadius="28px" maxW="430px" w="100%"
        overflow="hidden" boxShadow="0 40px 100px rgba(0,0,0,0.45)" border="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }}>
        <Box px={6} py={5} borderBottom="1px solid" borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }}>
          <HStack justify="space-between" align="flex-start">
            <Box>
              <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.400' }} fontWeight="700" textTransform="uppercase" letterSpacing="wider">
                Indian Virtual
              </Text>
              <Text fontSize="lg" fontWeight="800" color={{ base: 'gray.900', _dark: 'white' }}>
                Complete UPI Payment
              </Text>
            </Box>
            <Box as="button" onClick={onClose} color={{ base: 'gray.500', _dark: 'gray.400' }} fontSize="20px" lineHeight="1" cursor="pointer">
              ×
            </Box>
          </HStack>
        </Box>

        <Box p={6}>
          <Box borderRadius="2xl" bg={{ base: 'gray.50', _dark: 'whiteAlpha.50' }} border="1px solid"
            borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }} p={4} mb={5}>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" color={{ base: 'gray.600', _dark: 'gray.400' }}>Paying for</Text>
              <Text fontSize="sm" fontWeight="700" color={{ base: 'gray.900', _dark: 'white' }}>{intent.title}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color={{ base: 'gray.600', _dark: 'gray.400' }}>Amount</Text>
              <Text fontSize="2xl" fontWeight="900" color={intent.color || '#111827'}>₹{intent.amount.toLocaleString('en-IN')}</Text>
            </HStack>
          </Box>

          <Flex direction="column" align="center" gap={3} mb={5}>
            <Box bg="white" borderRadius="20px" p={3} border="1px solid #e5e7eb" boxShadow="0 10px 30px rgba(15,23,42,0.08)">
              <Box as="img" src={qrUrl} alt="UPI payment QR code" w="220px" h="220px" />
            </Box>
            <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.400' }} textAlign="center">
              Scan with any UPI app or use the button below. Payee: {UPI_PAYEE}
            </Text>
          </Flex>

          <Box as="a" href={upiLink} w="100%" py="13px" borderRadius="xl" display="flex" alignItems="center"
            justifyContent="center" fontWeight="800" color="white" mb={3}
            style={{ background: intent.gradient || 'linear-gradient(to right, #2563eb, #06b6d4)' }}>
            Pay in UPI app
          </Box>

          {intent.amount && (
            <Box as="a" href={`https://paypal.me/PritishDewan/${Number(intent.amount).toFixed(2)}inr`} target="_blank" rel="noopener noreferrer"
              w="100%" py="13px" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" fontWeight="800"
              color="white" mb={3} style={{ background: 'linear-gradient(to right, #003087, #009cde)' }}>
              Pay with PayPal
            </Box>
          )}

          <Box as="button" w="100%" py="12px" borderRadius="xl" border="1.5px solid"
            borderColor={{ base: 'gray.300', _dark: 'whiteAlpha.200' }} color={{ base: 'gray.800', _dark: 'white' }}
            fontWeight="700" cursor="pointer" onClick={handleConfirm} disabled={confirming}
            display="flex" alignItems="center" justifyContent="center" gap="8px">
            {confirming ? <Spinner size="sm" /> : 'I have paid'}
          </Box>

          <Text mt={4} fontSize="11px" lineHeight="1.6" color={{ base: 'gray.500', _dark: 'gray.500' }} textAlign="center">
            This is a manual UPI confirmation. Please only tap “I have paid” after your UPI app shows the payment as successful.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ChandaPage() {
  const { data: session } = useSession();
  const discordId = session?.user?.discordId || session?.user?.id;
  const callsign = session?.user?.callsign || 'Anonymous Pilot';
  const ifcName = session?.user?.ifcName || session?.user?.callsign || 'Anonymous Pilot';

  const [ mounted, setMounted ] = useState(false);
  const [ stats, setStats ] = useState({ contributors: 0, goals: {}, goalDefs: [], contributions: [], lotus: { subscribers: 0 } });
  const [ loadingStats, setLoading ] = useState(true);
  const [ thankYou, setThankYou ] = useState(null);
  const [ toast, setToast ] = useState(null);
  const [ paymentIntent, setPaymentIntent ] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const goals = stats.goalDefs ?? [];

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 6000);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/chanda/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        // stats API returned non-ok
      }
    } catch (err) {
      // ignore fetch errors
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [ fetchStats ]);

  const handleContribute = useCallback(async (goalId, amount) => {
    const goal = goalId === 'all'
      ? { title: 'All Goals', label: 'All Goals', color: '#6366f1', gradient: ALL_GRADIENT }
      : goals.find(g => g.id === goalId);

    setPaymentIntent({
      type: 'contribution',
      goalId,
      amount: Number(amount),
      title: goal?.title || goal?.label || goalId,
      color: goal?.color || '#6366f1',
      gradient: goal?.gradient || ALL_GRADIENT,
      note: `${goalId}|${ifcName || callsign}`,
    });
  }, [ goals ]);

  const handleLotusSubscribe = useCallback(({ amount, onClose, onSuccess }) => {
    setPaymentIntent({
      type: 'lotus',
      amount: Number(amount),
      title: 'Lotus Privé',
      color: '#c9a96e',
      gradient: 'linear-gradient(135deg, #b8952f, #e8c97e, #c9a96e)',
      onClose,
      onSuccess,
      note: `lotus|${ifcName || callsign}`,
    });
  }, [ ifcName, callsign ]);

  const confirmPayment = useCallback(async (intent) => {
    try {
      const endpoint = intent.type === 'lotus'
        ? '/api/chanda/lotus/verify'
        : '/api/chanda/verify';
      const body = intent.type === 'lotus'
        ? { discordId, ifcName: ifcName || callsign }
        : { goalId: intent.goalId, amount: intent.amount, discordId, ifcName: ifcName || callsign };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Confirmation failed');

      setPaymentIntent(null);
      intent.onSuccess?.();
      await fetchStats();

      if (intent.type === 'lotus') {
        showToast('Welcome to Lotus Privé. Your membership is active for this month.', true);
      } else {
        setThankYou({ goalId: intent.goalId, amount: intent.amount });
      }
    } catch (err) {
      intent.onClose?.();
      showToast(err.message || 'Could not confirm payment. Please contact staff.', false);
    }
  }, [ discordId, callsign, ifcName, fetchStats, showToast ]);

  const totalRaised = Object.values(stats.goals).reduce((a, b) => a + b, 0);
  const thankYouLabel = thankYou?.goalId === 'all'
    ? 'All Goals'
    : goals.find(g => g.id === thankYou?.goalId)?.label || thankYou?.goalId;

  const uniqueContributions = useMemo(() => {
    const seen = new Map();
    for (const c of stats.contributions || []) {
      const key = c.discordId
        ? `discord:${c.discordId}`
        : c.ifcName
          ? `ifc:${c.ifcName.trim().toLowerCase()}`
          : `payment:${c.paymentId}`;
      const existing = seen.get(key);
      if (!existing || (c.time || 0) > (existing.time || 0)) {
        seen.set(key, c);
      }
    }
    return Array.from(seen.values());
  }, [ stats.contributions ]);

  // Only render content after hydration
  if (!mounted) {
    return (
      <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>
        <Flex justify="center" py={16}><Spinner color="#6366f1" /></Flex>
      </Box>
    );
  }

  return (
    <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }} suppressHydrationWarning>

      {toast && (
        <Box position="fixed" bottom="24px" right="24px" zIndex={9998}
          bg={toast.ok ? '#10b981' : '#ef4444'} color="white"
          px={5} py={3} borderRadius="xl" fontSize="sm" fontWeight="600"
          boxShadow="0 8px 30px rgba(0,0,0,0.25)" maxW="380px">
          {toast.msg}
        </Box>
      )}

      {mounted && thankYou && (
        <ThankYouOverlay
          goalLabel={thankYouLabel} amount={thankYou.amount} callsign={callsign}
          onClose={() => setThankYou(null)}
        />
      )}

      {mounted && paymentIntent && (
        <UpiPaymentModal
          intent={paymentIntent}
          onClose={() => {
            paymentIntent.onClose?.();
            setPaymentIntent(null);
          }}
          onConfirm={confirmPayment}
        />
      )}

      {/* Hero */}
      <Box mb={12} textAlign="center" position="relative" overflow="hidden">
        <Box position="absolute" top="-10%" left="-14%" w={{ base: '220px', md: '320px' }} h={{ base: '220px', md: '320px' }}
          pointerEvents="none" userSelect="none" opacity={{ base: 0.07, _dark: 0.06 }} aria-hidden>
          <Box as="img" src="/inva-emblem.png" alt="" w="100%" h="100%" style={{ objectFit: 'contain' }} />
        </Box>

        <Badge px={3} py={1} borderRadius="full" mb={5}
          bg={{ base: '#6366f110', _dark: '#6366f120' }} color="#6366f1"
          border="1px solid #6366f130" fontSize="xs" fontWeight="700" letterSpacing="wider" textTransform="uppercase">
          Community Contributions
        </Badge>

        <Text as="h1" fontSize={{ base: '2xl', md: '4xl' }} fontWeight="800" lineHeight="1.25" letterSpacing="-0.5px"
          color={{ base: 'gray.900', _dark: 'white' }} mb={4}>
          Events. Fleet. Community.{' '}
          <Box as="span" display="inline" sx={{ background: 'linear-gradient(to right, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            All free, forever.
          </Box>
          <br />
          <Text as="span" fontSize={{ base: 'lg', md: '2xl' }} fontWeight="600" color={{ base: 'gray.700', _dark: 'gray.400' }}>
            Help keep it that way.
          </Text>
        </Text>

        <Text fontSize={{ base: 'sm', md: 'md' }} color={{ base: 'gray.700', _dark: 'gray.400' }} maxW="500px" mx="auto" lineHeight="1.75">
          This dashboard, your rank history, live flight tools — none of it runs on air.
          A small contribution keeps every crew member flying without ever hitting a paywall.
        </Text>
      </Box>

      {/* Stats bar */}
      <Grid templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }} gap={4} mb={10}>
        {[
          { icon: FiUsers, value: loadingStats ? '—' : stats.contributors, label: 'Contributors', color: '#6366f1' },
          { icon: FiHeart, value: loadingStats ? '—' : `₹${totalRaised.toLocaleString('en-IN')}`, label: 'Total Raised', color: '#f43f5e' },
          { icon: FiZap, value: loadingStats ? '—' : goals.length, label: 'Active Goals', color: '#f59e0b' },
        ].map(({ icon: Icon, value, label, color }) => (
          <Box key={label} bg={{ base: 'white', _dark: '#111827' }} border="1px solid"
            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} borderRadius="2xl" p={5} textAlign="center">
            <Flex w="40px" h="40px" borderRadius="10px" bg={`${color}15`} border="1px solid" borderColor={`${color}25`} align="center" justify="center" mx="auto" mb={3}>
              <Icon size={18} color={color} />
            </Flex>
            <Text fontWeight="800" fontSize="xl" color={{ base: 'gray.900', _dark: 'white' }}>{value}</Text>
            <Text fontSize="xs" color={{ base: 'gray.600', _dark: 'gray.500' }} mt={0.5}>{label}</Text>
          </Box>
        ))}
      </Grid>

      {/* Goals grid */}
      {loadingStats && goals.length === 0 ? (
        <Flex justify="center" py={16}><Spinner color="#6366f1" /></Flex>
      ) : (
        <>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={5} mb={0}>
            {goals.map((goal, idx) => (
              <Box key={goal.id} gridColumn={goals.length % 2 !== 0 && idx === goals.length - 1 ? { md: 'span 2' } : undefined}>
                <GoalCard goal={goal} raised={stats.goals[ goal.id ] || 0} onContribute={handleContribute} />
              </Box>
            ))}
          </Grid>

          <SupportAllCard goals={goals} goalStats={stats.goals} onContribute={handleContribute} />
        </>
      )}

      {/* Lotus Privé */}
      <LotusPriveSection
        subscribers={stats.lotus?.subscribers ?? 0}
        members={stats.lotus?.members ?? []}
        slotsRemaining={stats.lotus?.slotsRemaining ?? Math.max(0, 4 - (stats.lotus?.subscribers ?? 0))}
        onSubscribe={handleLotusSubscribe}
      />

      {/* Contributions feed */}
      {(stats.contributions?.length > 0 || loadingStats) && (
        <Box mt={12} mb={12}>
          <Text fontWeight="700" fontSize="md" color={{ base: 'gray.800', _dark: 'white' }} mb={5}>
            Recent contributions
          </Text>
          {loadingStats ? (
            <Flex justify="center" py={8}><Spinner color="#6366f1" /></Flex>
          ) : (
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3}>
              {uniqueContributions.map((c, i) => {
                const isAll = c.goalId === 'all';
                const goalDef = isAll ? null : goals.find(g => g.id === c.goalId);
                const color = goalDef?.color ?? '#6366f1';
                const label = isAll ? 'All Goals' : (goalDef?.label ?? c.goalId);
                const GoalIcon = goalDef ? (ICON_MAP[ goalDef.icon ] ?? FiHeart) : FiHeart;

                return (
                  <HStack key={i} bg={{ base: 'white', _dark: '#111827' }} border="1px solid"
                    borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.80' }} borderRadius="xl" p={4} gap={3} align="flex-start">
                    <Flex w="36px" h="36px" borderRadius="10px" flexShrink={0}
                      bg={isAll ? 'transparent' : `${color}15`} border="1px solid"
                      borderColor={isAll ? 'transparent' : `${color}30`}
                      align="center" justify="center"
                      sx={isAll ? { background: 'linear-gradient(135deg, #6366f1, #0ea5e9, #f59e0b, #10b981)' } : {}}>
                      {isAll ? <FiHeart size={16} color="white" /> : <GoalIcon size={16} color={color} />}
                    </Flex>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.800', _dark: 'white' }} isTruncated>
                        {c.ifcName || c.callsign}
                      </Text>
                      <Text fontSize="xs" color={{ base: 'gray.600', _dark: 'gray.500' }}>{label}</Text>
                    </Box>
                    <HStack gap={1} align="center" flexShrink={0}>
                      <FiClock size={11} color="#9ca3af" />
                      <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.600' }}>{timeAgo(c.time)}</Text>
                      {session?.user?.permissions?.length > 0 && c.paymentId && (
                        <Box as="button" ml={3} py={1} px={3} borderRadius="md" fontSize="12px" fontWeight="700"
                          border="1px solid" borderColor="#ef4444" color="#ef4444" bg="transparent" cursor="pointer"
                          onClick={async () => {
                            if (!confirm('Reverse this contribution?')) return;
                            try {
                              const res = await fetch('/api/chanda/reverse', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ paymentId: c.paymentId }),
                              });
                              const data = await res.json().catch(() => ({}));
                              if (res.ok) {
                                showToast('Contribution reversed', true);
                                fetchStats();
                              } else {
                                showToast(data.error || 'Reverse failed', false);
                              }
                            } catch (e) {
                              showToast('Reverse failed', false);
                            }
                          }}
                        >Reverse</Box>
                      )}
                    </HStack>
                  </HStack>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* Footer */}
      <Separator mb={6} borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }} />
      <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between" gap={4} px={2}>
        <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.600' }}>
          Payments are made manually through UPI and confirmed on trust. Contributions are voluntary and non-refundable.
        </Text>
        <Text fontSize="xs" color={{ base: 'gray.600', _dark: 'gray.500' }} textAlign={{ base: 'center', md: 'right' }}>
          <Box as="span" position="relative" display="inline-block" pb="6px">
            100% goes towards infrastructure costs
            <WavyUnderline color="#f59e0b" />
          </Box>
          . No admin salaries. No profit.
        </Text>
      </Flex>

    </Box>
  );
}
