"""Launch switches read from environment variables."""
import os


def _flag(name):
    value = os.environ.get(name)
    if value is None or value.strip() == '':
        return None
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def demo_payments_enabled():
    """The Bolt top-up and Shop checkout are demos that never charge anyone.

    They are on while developing and OFF in production unless DEMO_PAYMENTS is
    set to true. On iOS, Bolts must be sold through Apple In-App Purchase, and
    the Shop needs a real payment provider before either can be switched on
    for real customers.
    """
    explicit = _flag('DEMO_PAYMENTS')
    if explicit is not None:
        return explicit
    return os.environ.get('FLASK_ENV') != 'production'


def support_email():
    return os.environ.get('SUPPORT_EMAIL', '').strip()


def minimum_age():
    try:
        return int(os.environ.get('MINIMUM_AGE', 13))
    except ValueError:
        return 13
