package xyz.goraebap.cowork.module.workspace.richbody.application;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Order keys of a body's blocks: strings that sort in the blocks' order (base 36, never ending in 0), so a block put
 * between two others takes a key between theirs and no other block is rewritten. The midpoint follows the usual
 * fractional indexing (rocicorp/fractional-indexing).
 */
final class BlockKeys {
    static final String DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";

    private BlockKeys() {}

    /** A key between a and b: a is "" for the start, b null for the end, and a sorts before b. */
    static String midpoint(String a, String b) {
        if (b != null) {
            int n = 0;
            while (n < b.length() && digitAt(a, n) == b.charAt(n)) n++;
            if (n > 0) return b.substring(0, n) + midpoint(a.length() > n ? a.substring(n) : "", b.substring(n));
        }
        int digitA = a.isEmpty() ? 0 : DIGITS.indexOf(a.charAt(0));
        int digitB = b != null ? DIGITS.indexOf(b.charAt(0)) : DIGITS.length();
        if (digitB - digitA > 1) return String.valueOf(DIGITS.charAt((int) Math.round(0.5 * (digitA + digitB))));
        if (b != null && b.length() > 1) return b.substring(0, 1);
        return DIGITS.charAt(digitA) + midpoint(a.length() > 1 ? a.substring(1) : "", null);
    }

    /** n keys in order between a and b, spread evenly (their length grows with log n, not n). */
    static List<String> between(String a, String b, int n) {
        if (n <= 0) return List.of();
        String middle = midpoint(a, b);
        if (n == 1) return List.of(middle);
        int left = (n - 1) / 2;
        var keys = new ArrayList<String>(between(a, middle, left));
        keys.add(middle);
        keys.addAll(between(middle, b, n - 1 - left));
        return keys;
    }

    /**
     * The key of every block in the order given: the blocks that already stand in order (the longest run of existing keys
     * that rises along the order) keep theirs, and new or moved blocks take keys between their neighbours'.
     */
    static Map<String, String> assign(List<String> order, Map<String, String> existing) {
        String[] keys = order.stream().map(existing::get).toArray(String[]::new);
        Set<Integer> kept = risingRun(keys);
        var assigned = new HashMap<String, String>();
        String low = "";
        int at = 0;
        while (at < order.size()) {
            if (kept.contains(at)) {
                assigned.put(order.get(at), keys[at]);
                low = keys[at];
                at++;
                continue;
            }
            int end = at;
            while (end < order.size() && !kept.contains(end)) end++;
            String high = end < order.size() ? keys[end] : null;
            List<String> fresh = between(low, high, end - at);
            for (int index = at; index < end; index++) assigned.put(order.get(index), fresh.get(index - at));
            at = end;
        }
        return assigned;
    }

    /** The places of the longest strictly rising run of the non-null keys (patience sorting, n log n). */
    private static Set<Integer> risingRun(String[] keys) {
        int[] tails = new int[keys.length];
        int[] previous = new int[keys.length];
        Arrays.fill(previous, -1);
        int length = 0;
        for (int index = 0; index < keys.length; index++) {
            if (keys[index] == null) continue;
            int low = 0, high = length;
            while (low < high) {
                int middle = (low + high) >>> 1;
                if (keys[tails[middle]].compareTo(keys[index]) < 0) low = middle + 1;
                else high = middle;
            }
            if (low > 0) previous[index] = tails[low - 1];
            tails[low] = index;
            if (low == length) length++;
        }
        var run = new HashSet<Integer>();
        for (int index = length > 0 ? tails[length - 1] : -1; index >= 0; index = previous[index]) run.add(index);
        return run;
    }

    private static char digitAt(String key, int at) {
        return at < key.length() ? key.charAt(at) : '0';
    }
}
