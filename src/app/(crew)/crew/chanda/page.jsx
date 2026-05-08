'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Box, Flex, Text, VStack, HStack, Grid,
  Badge, Separator, Spinner, Input,
} from '@chakra-ui/react';
import { FiGlobe, FiDatabase, FiServer, FiCpu, FiHeart, FiUsers, FiZap, FiClock } from 'react-icons/fi';

const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

const GOALS = [
  {
    id: 'domain',
    icon: FiGlobe,
    label: 'Domain',
    title: 'indianvirtual.site',
    description: 'Annual renewal of our domain — the address every pilot types to reach home.',
    target: 1200,
    period: '/year',
    color: '#6366f1',
    gradient: 'linear-gradient(to right, #6366f1, #8b5cf6)',
  },
  {
    id: 'database',
    icon: FiDatabase,
    label: 'Database',
    title: 'Neon PostgreSQL',
    description: 'Every PIREP, rank, flight log, and crew record lives here. Zero downtime is the standard.',
    target: 3500,
    period: '/month',
    color: '#0ea5e9',
    gradient: 'linear-gradient(to right, #0ea5e9, #38bdf8)',
  },
  {
    id: 'hosting',
    icon: FiServer,
    label: 'Hosting',
    title: 'Vercel Pro',
    description: 'Powers this dashboard — instant deployments, global CDN, and the speed you deserve.',
    target: 2800,
    period: '/month',
    color: '#f59e0b',
    gradient: 'linear-gradient(to right, #f59e0b, #fbbf24)',
  },
  {
    id: 'bot',
    icon: FiCpu,
    label: 'Bot Hosting',
    title: 'Discord Bot VPS',
    description: 'The 24/7 server running rank promotions, ticket systems, and live alerts for your flights.',
    target: 1500,
    period: '/month',
    color: '#10b981',
    gradient: 'linear-gradient(to right, #10b981, #34d399)',
  },
];

const AMOUNTS = [100, 250, 500, 1000];

const GOAL_LABELS = {
  domain: 'Domain',
  database: 'Database',
  hosting: 'Hosting',
  bot: 'Bot Hosting',
};

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function WavyUnderline({ color = '#f59e0b' }) {
  return (
    <Box
      as="span"
      position="absolute"
      bottom="-6px"
      left={0}
      right={0}
      overflow="hidden"
      lineHeight={0}
      pointerEvents="none"
    >
      <svg viewBox="0 0 200 8" preserveAspectRatio="none" height="8" style={{ display: 'block', width: '100%' }}>
        <path
          d="M0,4 C12,0 24,8 36,4 C48,0 60,8 72,4 C84,0 96,8 108,4 C120,0 132,8 144,4 C156,0 168,8 180,4 C192,0 200,5 200,4"
          stroke={color}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </Box>
  );
}

function GoalCard({ goal, raised, onContribute }) {
  const [selected, setSelected] = useState(null);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const pct = Math.min(100, Math.round((raised / goal.target) * 100));
  const Icon = goal.icon;

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
    <Box
      bg={{ base: 'white', _dark: '#111827' }}
      border="1px solid"
      borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
      borderRadius="2xl"
      overflow="hidden"
    >
      <Box h="3px" sx={{ background: goal.gradient }} />

      <Box p={6}>
        <HStack mb={4} gap={3}>
          <Flex
            w="44px" h="44px" borderRadius="12px"
            align="center" justify="center"
            bg={`${goal.color}18`}
            border="1px solid"
            borderColor={`${goal.color}30`}
            flexShrink={0}
          >
            <Icon size={20} color={goal.color} />
          </Flex>
          <Box flex={1} minW={0}>
            <Text fontSize="xs" fontWeight="600" color={goal.color} textTransform="uppercase" letterSpacing="wider" mb={0.5}>
              {goal.label}
            </Text>
            <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.800', _dark: 'white' }}>
              {goal.title}
            </Text>
          </Box>
          <Box textAlign="right" flexShrink={0}>
            <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.400' }}>Goal</Text>
            <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.700', _dark: 'gray.200' }}>
              ₹{goal.target.toLocaleString('en-IN')}
              <Text as="span" fontWeight="400" fontSize="xs" color={{ base: 'gray.400', _dark: 'gray.500' }}>
                {goal.period}
              </Text>
            </Text>
          </Box>
        </HStack>

        <Text fontSize="sm" color={{ base: 'gray.600', _dark: 'gray.400' }} lineHeight="1.6" mb={5}>
          {goal.description}
        </Text>

        {/* Progress */}
        <Box mb={5}>
          <HStack justify="space-between" mb={2}>
            <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.500' }}>Raised</Text>
            <HStack gap={1} align="baseline">
              <Text fontSize="sm" fontWeight="700" color={goal.color}>
                ₹{raised.toLocaleString('en-IN')}
              </Text>
              <Text fontSize="xs" color={{ base: 'gray.400', _dark: 'gray.600' }}>
                / ₹{goal.target.toLocaleString('en-IN')}
              </Text>
            </HStack>
          </HStack>
          <Box
            h="6px" borderRadius="full"
            bg={{ base: 'gray.100', _dark: 'whiteAlpha.100' }}
            overflow="hidden"
          >
            <Box
              h="100%" borderRadius="full"
              sx={{ background: goal.gradient }}
              w={`${pct}%`}
              transition="width 1s ease"
            />
          </Box>
          <Text fontSize="xs" color={{ base: 'gray.400', _dark: 'gray.600' }} mt={1.5} textAlign="right">
            {pct}% funded
          </Text>
        </Box>

        {/* Amount quick-select */}
        <Grid templateColumns="repeat(4, 1fr)" gap={2} mb={3}>
          {AMOUNTS.map(amt => (
            <Box
              key={amt}
              as="button"
              py={2}
              borderRadius="lg"
              fontSize="sm"
              fontWeight="600"
              border="1.5px solid"
              borderColor={selected === amt ? goal.color : { base: 'gray.200', _dark: 'whiteAlpha.150' }}
              bg={selected === amt ? `${goal.color}15` : 'transparent'}
              color={selected === amt ? goal.color : { base: 'gray.600', _dark: 'gray.400' }}
              transition="all 0.15s"
              cursor="pointer"
              _hover={{ borderColor: goal.color, color: goal.color }}
              onClick={() => { setSelected(amt); setCustom(''); }}
            >
              ₹{amt}
            </Box>
          ))}
        </Grid>

        {/* Custom amount */}
        <Box mb={4}>
          <Box
            as="button"
            w="100%"
            py={2}
            px={4}
            borderRadius="lg"
            border="1.5px solid"
            borderColor={selected === 'custom' ? goal.color : { base: 'gray.200', _dark: 'whiteAlpha.150' }}
            bg={selected === 'custom' ? `${goal.color}10` : 'transparent'}
            onClick={() => setSelected('custom')}
            display="block"
            cursor="pointer"
            textAlign="left"
          >
            {selected === 'custom' ? (
              <Flex align="center" gap={2}>
                <Text color={{ base: 'gray.500', _dark: 'gray.400' }} fontSize="sm" flexShrink={0}>₹</Text>
                <Input
                  autoFocus
                  variant="unstyled"
                  type="number"
                  min={1}
                  placeholder="Enter amount"
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  color={{ base: 'gray.800', _dark: 'white' }}
                  _placeholder={{ color: { base: 'gray.400', _dark: 'gray.600' } }}
                  fontSize="sm"
                  fontWeight="600"
                  flex={1}
                />
              </Flex>
            ) : (
              <Text fontSize="sm" color={{ base: 'gray.500', _dark: 'gray.500' }}>Custom amount…</Text>
            )}
          </Box>
        </Box>

        {/* CTA */}
        <Box
          as="button"
          w="100%"
          py="12px"
          borderRadius="xl"
          fontSize="sm"
          fontWeight="700"
          style={selected ? { background: goal.gradient, color: '#fff', border: 'none' } : {}}
          bg="transparent"
          border="1.5px solid"
          borderColor={{ base: 'gray.300', _dark: 'whiteAlpha.200' }}
          color={{ base: 'gray.500', _dark: 'gray.400' }}
          cursor={selected ? 'pointer' : 'not-allowed'}
          transition="opacity 0.2s"
          opacity={loading ? 0.7 : 1}
          _hover={selected ? { opacity: 0.88 } : {}}
          onClick={selected ? handleContribute : undefined}
          letterSpacing="wide"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap="8px"
        >
          {loading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <FiHeart size={14} />
              {selected
                ? `Contribute ₹${selected === 'custom' ? (custom || '—') : selected.toLocaleString('en-IN')}`
                : 'Select an amount above'}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function ThankYouOverlay({ goalLabel, amount, callsign, onClose }) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="blackAlpha.700"
      backdropFilter="blur(6px)"
      onClick={onClose}
    >
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={300}
        recycle={false}
        colors={['#6366f1', '#0ea5e9', '#f59e0b', '#10b981', '#f43f5e', '#a78bfa']}
      />
      <Box
        bg={{ base: 'white', _dark: '#111827' }}
        borderRadius="3xl"
        p={{ base: 8, md: 12 }}
        maxW="480px"
        w="90%"
        textAlign="center"
        boxShadow="0 40px 80px rgba(0,0,0,0.4)"
        border="1px solid"
        borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.100' }}
        onClick={e => e.stopPropagation()}
      >
        <Text fontSize="4xl" mb={4}>🛫</Text>
        <Text
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="800"
          color={{ base: 'gray.900', _dark: 'white' }}
          lineHeight="1.3"
          mb={3}
        >
          You just kept INVA flying,<br />
          <Text as="span" sx={{ background: 'linear-gradient(to right, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {callsign}
          </Text>
        </Text>
        <Text fontSize="sm" color={{ base: 'gray.500', _dark: 'gray.400' }} mb={2} lineHeight="1.7">
          Your ₹{amount?.toLocaleString('en-IN')} contribution toward <strong>{goalLabel}</strong> means every pilot here gets to keep filing PIREPs, checking routes, and flying together.
        </Text>
        <Text fontSize="sm" color={{ base: 'gray.500', _dark: 'gray.400' }} mb={6} lineHeight="1.7">
          You've been awarded the <Text as="span" color="#6366f1" fontWeight="700">Supporter</Text> role on Discord. Thank you for being part of what makes this community real. ❤️
        </Text>
        <Box
          as="button"
          w="100%"
          py="12px"
          borderRadius="xl"
          fontSize="sm"
          fontWeight="700"
          sx={{ background: 'linear-gradient(to right, #6366f1, #0ea5e9)' }}
          color="white"
          cursor="pointer"
          onClick={onClose}
        >
          Back to Contributions
        </Box>
      </Box>
    </Box>
  );
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));
    if (window.Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.head.appendChild(script);
  });
}

export default function ChandaPage({ discordId, callsign, ifcName }) {
  const [stats, setStats] = useState({ contributors: 0, goals: {}, contributions: [] });
  const [loadingStats, setLoadingStats] = useState(true);
  const [thankYou, setThankYou] = useState(null);
  const [toast, setToast] = useState(null);
  const rzpRef = useRef(null);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 6000);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/chanda/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
    setLoadingStats(false);
  }, []);

  useEffect(() => {
    fetchStats();
    // Preload Razorpay script immediately on mount so first click is instant
    loadRazorpayScript().catch(() => {});
  }, [fetchStats]);

  const handleContribute = useCallback(async (goalId, amount) => {
    try {
      await loadRazorpayScript();

      // Create order via server (raw fetch → Razorpay REST API)
      const orderRes = await fetch('/api/chanda/order', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ amount, goalId, discordId, ifcName: ifcName || callsign }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || `Order failed (${orderRes.status})`);

      const { orderId, currency, key } = orderData;
      if (!key || !orderId) throw new Error('Invalid order response from server');

      const goal = GOALS.find(g => g.id === goalId);

      await new Promise((resolve) => {
        // Standard Checkout — do NOT pass `amount` when using `order_id`
        rzpRef.current = new window.Razorpay({
          key,
          order_id: orderId,
          currency,
          name:        'Indian Virtual',
          description: goal?.title ?? goalId,
          theme:       { color: goal?.color ?? '#6366f1' },

          handler(response) {
            // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
            fetch('/api/chanda/verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                goalId,
                amount:    orderData.amount, // paise, from order
                discordId,
                ifcName:   ifcName || callsign,
              }),
            })
              .then(r => {
                if (r.ok) {
                  setThankYou({ goalId, amount: Math.round(orderData.amount / 100) });
                  fetchStats();
                } else {
                  showToast('Payment received but confirmation failed — contact staff.', false);
                }
              })
              .catch(() => showToast('Network error during confirmation — contact staff.', false))
              .finally(resolve);
          },

          modal: {
            ondismiss: resolve,
            escape:    true,
          },
        });

        rzpRef.current.on('payment.failed', (resp) => {
          const desc = resp?.error?.description ?? 'Payment declined';
          showToast(`Payment failed: ${desc}`, false);
          resolve();
        });

        rzpRef.current.open();
      });
    } catch (err) {
      console.error('[Chanda] contribute error:', err);
      showToast(err.message || 'Something went wrong — please try again.', false);
    }
  }, [discordId, callsign, fetchStats, showToast]);

  const totalRaised = Object.values(stats.goals).reduce((a, b) => a + b, 0);

  return (
    <Box maxW="1100px" mx="auto" px={{ base: 4, md: 6 }} py={{ base: 6, md: 10 }}>

      {toast && (
        <Box
          position="fixed" bottom="24px" right="24px" zIndex={9998}
          bg={toast.ok ? '#10b981' : '#ef4444'} color="white"
          px={5} py={3} borderRadius="xl" fontSize="sm" fontWeight="600"
          boxShadow="0 8px 30px rgba(0,0,0,0.25)" maxW="380px"
        >
          {toast.msg}
        </Box>
      )}

      {thankYou && (
        <ThankYouOverlay
          goalLabel={GOAL_LABELS[thankYou.goalId] || thankYou.goalId}
          amount={thankYou.amount}
          callsign={callsign}
          onClose={() => setThankYou(null)}
        />
      )}

      {/* Hero */}
      <Box mb={12} textAlign="center" position="relative" overflow="hidden">

        {/* Decorative emblem — top-left corner, right-top quadrant visible */}
        <Box
          position="absolute"
          top="-10%"
          left="-14%"
          w={{ base: '220px', md: '320px' }}
          h={{ base: '220px', md: '320px' }}
          pointerEvents="none"
          userSelect="none"
          opacity={{ base: 0.07, _dark: 0.06 }}
          aria-hidden
        >
          <Box
            as="img"
            src="/inva-emblem.png"
            alt=""
            w="100%"
            h="100%"
            style={{ objectFit: 'contain' }}
          />
        </Box>

        <Badge
          px={3} py={1} borderRadius="full" mb={5}
          bg={{ base: '#6366f110', _dark: '#6366f120' }}
          color="#6366f1"
          border="1px solid #6366f130"
          fontSize="xs"
          fontWeight="700"
          letterSpacing="wider"
          textTransform="uppercase"
        >
          Community Contributions
        </Badge>

        <Text
          as="h1"
          fontSize={{ base: '2xl', md: '4xl' }}
          fontWeight="800"
          lineHeight="1.25"
          letterSpacing="-0.5px"
          color={{ base: 'gray.900', _dark: 'white' }}
          mb={4}
        >
          Routes. PIREPs. Community.{' '}
          <Box as="span" display="inline" sx={{ background: 'linear-gradient(to right, #6366f1, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            All free, forever.
          </Box>
          <br />
          <Text as="span" fontSize={{ base: 'lg', md: '2xl' }} fontWeight="600" color={{ base: 'gray.500', _dark: 'gray.400' }}>
            Help keep it that way.
          </Text>
        </Text>

        <Text
          fontSize={{ base: 'sm', md: 'md' }}
          color={{ base: 'gray.600', _dark: 'gray.400' }}
          maxW="500px"
          mx="auto"
          lineHeight="1.75"
        >
          This dashboard, your rank history, live flight tools — none of it runs on air.
          A small contribution keeps every crew member flying without ever hitting a paywall.
        </Text>
      </Box>

      {/* Stats bar */}
      <Grid
        templateColumns={{ base: '1fr 1fr', md: 'repeat(3, 1fr)' }}
        gap={4}
        mb={10}
      >
        {[
          { icon: FiUsers, value: loadingStats ? '—' : stats.contributors, label: 'Contributors', color: '#6366f1' },
          { icon: FiHeart, value: loadingStats ? '—' : `₹${totalRaised.toLocaleString('en-IN')}`, label: 'Total Raised', color: '#f43f5e' },
          { icon: FiZap, value: GOALS.length, label: 'Active Goals', color: '#f59e0b' },
        ].map(({ icon: Icon, value, label, color }) => (
          <Box
            key={label}
            bg={{ base: 'white', _dark: '#111827' }}
            border="1px solid"
            borderColor={{ base: 'gray.200', _dark: 'whiteAlpha.100' }}
            borderRadius="2xl"
            p={5}
            textAlign="center"
          >
            <Flex w="40px" h="40px" borderRadius="10px" bg={`${color}15`} border="1px solid" borderColor={`${color}25`} align="center" justify="center" mx="auto" mb={3}>
              <Icon size={18} color={color} />
            </Flex>
            <Text fontWeight="800" fontSize="xl" color={{ base: 'gray.900', _dark: 'white' }}>{value}</Text>
            <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.500' }} mt={0.5}>{label}</Text>
          </Box>
        ))}
      </Grid>

      {/* Goals grid */}
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
        gap={5}
        mb={12}
      >
        {GOALS.map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            raised={stats.goals[goal.id] || 0}
            onContribute={handleContribute}
          />
        ))}
      </Grid>

      {/* Contributions feed */}
      {(stats.contributions?.length > 0 || loadingStats) && (
        <Box mb={12}>
          <Text fontWeight="700" fontSize="md" color={{ base: 'gray.800', _dark: 'white' }} mb={5}>
            Recent contributions
          </Text>
          {loadingStats ? (
            <Flex justify="center" py={8}><Spinner color="#6366f1" /></Flex>
          ) : (
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={3}>
              {stats.contributions.map((c, i) => {
                const goal = GOALS.find(g => g.id === c.goalId);
                return (
                  <HStack
                    key={i}
                    bg={{ base: 'white', _dark: '#111827' }}
                    border="1px solid"
                    borderColor={{ base: 'gray.100', _dark: 'whiteAlpha.80' }}
                    borderRadius="xl"
                    p={4}
                    gap={3}
                    align="flex-start"
                  >
                    <Flex
                      w="36px" h="36px" borderRadius="10px" flexShrink={0}
                      bg={goal ? `${goal.color}15` : '#6366f115'}
                      border="1px solid"
                      borderColor={goal ? `${goal.color}30` : '#6366f130'}
                      align="center" justify="center"
                    >
                      {goal ? <goal.icon size={16} color={goal.color} /> : <FiHeart size={16} color="#6366f1" />}
                    </Flex>
                    <Box flex={1} minW={0}>
                      <Text fontWeight="700" fontSize="sm" color={{ base: 'gray.800', _dark: 'white' }} isTruncated>
                        {c.ifcName || c.callsign}
                      </Text>
                      <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.500' }}>
                        {goal?.label || c.goalId}
                      </Text>
                    </Box>
                    <HStack gap={1} align="center" flexShrink={0}>
                      <FiClock size={11} color="#9ca3af" />
                      <Text fontSize="xs" color={{ base: 'gray.400', _dark: 'gray.600' }}>
                        {timeAgo(c.time)}
                      </Text>
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
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="space-between"
        gap={4}
        px={2}
      >
        <Text fontSize="xs" color={{ base: 'gray.400', _dark: 'gray.600' }}>
          Payments processed securely by Razorpay. Contributions are voluntary and non-refundable.
        </Text>
        <Text fontSize="xs" color={{ base: 'gray.500', _dark: 'gray.500' }} textAlign={{ base: 'center', md: 'right' }}>
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
