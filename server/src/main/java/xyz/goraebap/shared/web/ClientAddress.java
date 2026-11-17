package xyz.goraebap.shared.web;

import jakarta.servlet.http.HttpServletRequest;
import java.net.InetAddress;
import java.net.UnknownHostException;

/** Where a request came from, for the records that keep it. */
public final class ClientAddress {
    private static final int MAX = 45;

    private ClientAddress() {}

    /**
     * The client's address. Behind the company nginx the connection is the proxy's, so its X-Real-IP is taken, but only
     * when the connection itself is local or private: a client on the internet cannot name its own address.
     */
    public static String of(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        String forwarded = request.getHeader("X-Real-IP");
        if (forwarded == null || forwarded.isBlank()) return cut(remote);
        try {
            var address = InetAddress.getByName(remote);
            boolean proxy = address.isLoopbackAddress() || address.isSiteLocalAddress() || address.isLinkLocalAddress();
            return cut(proxy ? forwarded.trim() : remote);
        } catch (UnknownHostException e) {
            return cut(remote);
        }
    }

    /** The browser's User-Agent, cut to 300 characters; null without one. */
    public static String agentOf(HttpServletRequest request) {
        String agent = request.getHeader("User-Agent");
        return agent == null || agent.length() <= 300 ? agent : agent.substring(0, 300);
    }

    private static String cut(String text) {
        return text == null || text.length() <= MAX ? text : text.substring(0, MAX);
    }
}
