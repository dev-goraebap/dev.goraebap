package xyz.goraebap.foundation.shared.web;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.authorization.method.PreAuthorizeAuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.util.SimpleMethodInvocation;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Evaluates a handler's {@link PreAuthorize} before its arguments are bound and validated. Method security alone runs
 * when the controller method is invoked, after binding, so a member sending a malformed body to an administrators'
 * endpoint would get 400 and learn its validation rules instead of 403. The rule stays the one annotation: this checks
 * it early with the same expression handler and method security checks it again on the call.
 *
 * <p>An expression that reads the method's arguments (#name) or its result cannot be judged before binding; those are
 * left to method security alone.
 */
@Configuration(proxyBeanMethods = false)
final class PreAuthorizeBeforeBinding implements HandlerInterceptor, WebMvcConfigurer {
    private final PreAuthorizeAuthorizationManager preAuthorizeAuthorizationManager =
            new PreAuthorizeAuthorizationManager();

    private final ApplicationContext applicationContext;

    PreAuthorizeBeforeBinding(
            ApplicationContext applicationContext,
            ObjectProvider<MethodSecurityExpressionHandler> methodSecurityExpressionHandlerProvider) {
        this.applicationContext = applicationContext;
        preAuthorizeAuthorizationManager.setApplicationContext(applicationContext);
        methodSecurityExpressionHandlerProvider.ifUnique(preAuthorizeAuthorizationManager::setExpressionHandler);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns("/api/**");
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // The dispatch that ends a long response carries no session; the request was judged when it began.
        if (request.getDispatcherType() != DispatcherType.REQUEST) return true;
        if (!(handler instanceof HandlerMethod handlerMethod)) return true;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && refuses(handlerMethod, authentication))
            throw new AccessDeniedException("접근 권한이 없습니다");
        return true;
    }

    /**
     * Whether every handler at the request's path and method refuses the caller, whatever the request accepts. The
     * handler is chosen by its produces condition before preHandle runs, so a mismatch there would answer first; this
     * lets that answer give way to the refusal.
     */
    boolean refusesEveryHandler(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return false;
        RequestMappingHandlerMapping requestMappingHandlerMapping =
                applicationContext.getBean("requestMappingHandlerMapping", RequestMappingHandlerMapping.class);
        boolean matched = false;
        for (var entry : requestMappingHandlerMapping.getHandlerMethods().entrySet()) {
            RequestMappingInfo requestMappingInfo = entry.getKey();
            if (requestMappingInfo.getMethodsCondition().getMatchingCondition(request) == null
                    || requestMappingInfo.getActivePatternsCondition().getMatchingCondition(request) == null) continue;
            if (!refuses(entry.getValue(), authentication)) return false;
            matched = true;
        }
        return matched;
    }

    private boolean refuses(HandlerMethod handlerMethod, Authentication authentication) {
        PreAuthorize preAuthorize = findPreAuthorize(handlerMethod);
        if (preAuthorize == null || readsArguments(preAuthorize.value())) return false;
        // Mapped handler methods name their bean until a request resolves them.
        Object bean = handlerMethod.getBean() instanceof String beanName
                ? applicationContext.getBean(beanName)
                : handlerMethod.getBean();
        AuthorizationResult result = preAuthorizeAuthorizationManager.authorize(
                () -> authentication, new SimpleMethodInvocation(bean, handlerMethod.getMethod()));
        return result != null && !result.isGranted();
    }

    private static PreAuthorize findPreAuthorize(HandlerMethod handlerMethod) {
        PreAuthorize onMethod =
                AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getMethod(), PreAuthorize.class);
        return onMethod != null
                ? onMethod
                : AnnotatedElementUtils.findMergedAnnotation(handlerMethod.getBeanType(), PreAuthorize.class);
    }

    private static boolean readsArguments(String expression) {
        return expression.contains("#") || expression.contains("returnObject");
    }
}
