import { createStyles, Image, Container, Title, Text, Button, SimpleGrid } from '@mantine/core';
import { Link } from 'react-router-dom';

const useStyles = createStyles((theme) => ({
    root: {
        paddingTop: 80,
        paddingBottom: 80,
    },

    title: {
        fontWeight: 900,
        fontSize: 34,
        marginBottom: theme.spacing.md,
        fontFamily: `Greycliff CF, ${theme.fontFamily}`,

        [theme.fn.smallerThan('sm')]: {
            fontSize: 32,
        },
    },

    control: {
        [theme.fn.smallerThan('sm')]: {
            width: '100%',
        },
    },

    mobileImage: {
        [theme.fn.largerThan('sm')]: {
            display: 'none',
        },
    },

    desktopImage: {
        [theme.fn.smallerThan('sm')]: {
            display: 'none',
        },
    },
}));

export default function The404() {
    const { classes } = useStyles();

    return (
        <Container className={classes.root}>
            <SimpleGrid spacing={80} cols={2} breakpoints={[{ maxWidth: 'sm', cols: 1, spacing: 40 }]}>
                <Image src="/404.svg" className={classes.mobileImage} />
                <div>
                    <Title className={classes.title}>Something is not right...</Title>
                    <Text color="dimmed" size="lg">
                        Page you are trying to open does not exist. You may have mistyped the address, or the
                        page has been moved to another URL. If you think this is an error contact support.
                    </Text>
                    <Link to="/">
                        <Button variant="outline" size="md" mt="xl" className={classes.control}>
                            Get back to home page
                        </Button>
                    </Link>
                </div>
                <Image src="/404.svg" className={classes.desktopImage} />
            </SimpleGrid>
        </Container>
    );
}