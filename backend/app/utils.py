async def worker(semaphore, func, *args):
    async with semaphore:
        return await func(*args)